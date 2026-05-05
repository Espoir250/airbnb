import { Response } from "express";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../config/prisma";
import { filterExtractionModel, model } from "../config/ai";
import { getCache, setCache } from "../config/cache";
import { getPagination, getTotalPages } from "../utils/request";
import { ListingType, Prisma } from ".prisma/client/default";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchFilters = {
  location: string | null;
  type: ListingType | null;
  maxPrice: number | null;
  guests: number | null;
};

type RecommendationAiResult = {
  preferences: string;
  searchFilters: SearchFilters;
  reason: string;
};

type ReviewSummary = {
  summary: string;
  positives: string[];
  negatives: string[];
  averageRating: number;
  totalReviews: number;
};

// ─── In-memory chat sessions ──────────────────────────────────────────────────

const chatSessions = new Map<string, BaseMessage[]>();

// ─── Valid tone values ────────────────────────────────────────────────────────

const validTones = ["professional", "casual", "luxury"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeListingType = (type: unknown): ListingType | null => {
  if (typeof type !== "string") return null;
  const normalized = type.toUpperCase();
  return normalized in ListingType ? (normalized as ListingType) : null;
};

const normalizeNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const normalizeFilters = (input: unknown): SearchFilters => {
  const data =
    typeof input === "object" && input ? (input as Record<string, unknown>) : {};
  return {
    location:
      typeof data.location === "string" && data.location.trim()
        ? data.location.trim()
        : null,
    type: normalizeListingType(data.type),
    maxPrice: normalizeNumber(data.maxPrice),
    guests: normalizeNumber(data.guests),
  };
};

const hasAnyFilter = (filters: SearchFilters): boolean =>
  Boolean(filters.location || filters.type || filters.maxPrice || filters.guests);

const filtersToWhere = (
  filters: SearchFilters,
  excludeListingIds: string[] = [],
): Prisma.ListingWhereInput => ({
  ...(filters.location && {
    location: { contains: filters.location, mode: "insensitive" },
  }),
  ...(filters.type && { type: filters.type }),
  ...(filters.maxPrice && { pricePerNight: { lte: filters.maxPrice } }),
  ...(filters.guests && { guests: { gte: filters.guests } }),
  ...(excludeListingIds.length > 0 && { id: { notIn: excludeListingIds } }),
});

const textFromAiResponse = (response: AIMessage): string => {
  if (typeof response.content === "string") return response.content;
  return response.content
    .map((part) => ("text" in part ? part.text : ""))
    .join("")
    .trim();
};

const parseJsonObject = <T>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
};

const getAiErrorResponse = (error: unknown) => {
  const candidate = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
  };
  const status =
    candidate.status ?? candidate.statusCode ?? candidate.response?.status;

  if (status === 429)
    return { status: 429, message: "AI service is busy, please try again in a moment" };
  if (status === 401)
    return { status: 500, message: "AI service configuration error" };

  return null;
};

const invokeAi = async (
  messages: BaseMessage[],
  deterministic = false,
): Promise<string> => {
  const response = await (deterministic ? filterExtractionModel : model).invoke(messages);
  return textFromAiResponse(response);
};

// ─── Part 1 — Smart Listing Search ───────────────────────────────────────────

export const smartSearchListings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const { page, limit, skip } = getPagination(req);

    const raw = await invokeAi(
      [
        new SystemMessage(
          `Extract Airbnb listing search filters from the user query.
Return only JSON with this exact shape:
{"location":"string or null","type":"APARTMENT | HOUSE | VILLA | CABIN or null","maxPrice":"number or null","guests":"number or null"}
Use null when the query does not clearly specify a value.`,
        ),
        new HumanMessage(query),
      ],
      true, // deterministic — temperature: 0
    );

    const filters = normalizeFilters(parseJsonObject(raw));

    if (!hasAnyFilter(filters)) {
      res.status(400).json({
        message: "Could not extract any filters from your query, please be more specific",
      });
      return;
    }

    const where = filtersToWhere(filters);
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { host: { select: { name: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    res.status(200).json({
      filters,
      data: listings,
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
  } catch (error) {
    const aiError = getAiErrorResponse(error);
    if (aiError) {
      res.status(aiError.status).json({ message: aiError.message });
      return;
    }
    console.error("AI search error:", error);
    res.status(500).json({ message: "Error searching listings with AI" });
  }
};

// ─── Part 2 — Listing Description Generator ──────────────────────────────────

export const generateListingDescription = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const listingId = req.params.id as string;
    const rawTone = req.body?.tone ?? "professional";

    if (!validTones.includes(rawTone)) {
      res.status(400).json({ message: "Tone must be professional, casual, or luxury" });
      return;
    }
    const tone = rawTone as (typeof validTones)[number];

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    if (listing.hostId !== req.userId && req.role !== "ADMIN") {
      res
        .status(403)
        .json({ message: "You can only generate descriptions for your own listings" });
      return;
    }

    const toneInstructions = {
      professional: "formal, clear, business-like",
      casual: "friendly, relaxed, conversational",
      luxury: "elegant, premium, aspirational",
    };

    const description = (
      await invokeAi([
        new SystemMessage(
          `You write concise Airbnb listing descriptions in a ${toneInstructions[tone]} tone.
Return only the description text. Do not add labels, markdown, or quotes.`,
        ),
        new HumanMessage(
          `Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ") || "None listed"}
Current description: ${listing.description}`,
        ),
      ])
    ).trim();

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { description },
    });

    res.status(200).json({ description, listing: updatedListing });
  } catch (error) {
    const aiError = getAiErrorResponse(error);
    if (aiError) {
      res.status(aiError.status).json({ message: aiError.message });
      return;
    }
    console.error("Description generation error:", error);
    res.status(500).json({ message: "Error generating listing description" });
  }
};

// ─── Part 3 — Guest Support Chatbot ──────────────────────────────────────────

export const guestSupportChat = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId, listingId, message } = req.body;

    if (
      !sessionId ||
      !message ||
      typeof sessionId !== "string" ||
      typeof message !== "string"
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    let systemPrompt =
      "You are a helpful guest support assistant for an Airbnb-like platform.";

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: String(listingId) },
      });
      if (!listing) {
        res.status(404).json({ message: "Listing not found" });
        return;
      }

      systemPrompt = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:

Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ") || "None listed"}
Description: ${listing.description}

Answer questions about this listing accurately based on the details above.
If asked something not covered by the listing details, say you don't have that information.`;
    }

    const history = chatSessions.get(sessionId) ?? [];
    const trimmedHistory = history.slice(-20); // last 10 exchanges = 20 messages

    const aiResponse = await invokeAi([
      new SystemMessage(systemPrompt),
      ...trimmedHistory,
      new HumanMessage(message),
    ]);

    const nextHistory = [
      ...trimmedHistory,
      new HumanMessage(message),
      new AIMessage(aiResponse),
    ].slice(-20);

    chatSessions.set(sessionId, nextHistory);

    res.status(200).json({
      response: aiResponse,
      sessionId,
      messageCount: nextHistory.length,
    });
  } catch (error) {
    const aiError = getAiErrorResponse(error);
    if (aiError) {
      res.status(aiError.status).json({ message: aiError.message });
      return;
    }
    console.error("Guest support chat error:", error);
    res.status(500).json({ message: "Error generating chat response" });
  }
};

// ─── Part 4 — AI Booking Recommendation ──────────────────────────────────────

export const recommendListings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId: req.userId },
      include: { listing: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    if (bookings.length === 0) {
      res.status(400).json({
        message:
          "No booking history found. Make some bookings first to get recommendations.",
      });
      return;
    }

    const historySummary = bookings
      .map(
        (booking, index) =>
          `${index + 1}. ${booking.listing.title} in ${booking.listing.location}, ` +
          `${booking.listing.type}, $${booking.listing.pricePerNight}/night, ` +
          `${booking.guests} guests, amenities: ${booking.listing.amenities.join(", ") || "None listed"}`,
      )
      .join("\n");

    const raw = await invokeAi([
      new SystemMessage(
        `Analyze booking history and return only JSON in this exact format:
{"preferences":"string describing what the user likes","searchFilters":{"location":"string or null","type":"APARTMENT | HOUSE | VILLA | CABIN or null","maxPrice":"number or null","guests":"number or null"},"reason":"string explaining the recommendation"}`,
      ),
      new HumanMessage(historySummary),
    ]);

    const aiResult = parseJsonObject<RecommendationAiResult>(raw);
    const searchFilters = normalizeFilters(aiResult?.searchFilters);
    const alreadyBookedIds = [...new Set(bookings.map((b) => b.listingId))];

    const recommendations = await prisma.listing.findMany({
      where: filtersToWhere(searchFilters, alreadyBookedIds),
      include: { host: { select: { name: true, email: true } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      preferences:
        aiResult?.preferences ??
        "Could not infer detailed preferences from booking history.",
      reason:
        aiResult?.reason ??
        "Recommendations are based on your recent booking history.",
      searchFilters,
      recommendations,
    });
  } catch (error) {
    const aiError = getAiErrorResponse(error);
    if (aiError) {
      res.status(aiError.status).json({ message: aiError.message });
      return;
    }
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
};

// ─── Part 5 — Listing Review Summarizer ──────────────────────────────────────

export const summarizeListingReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const listingId = req.params.id as string;
    const cacheKey = `ai:review-summary:${listingId}`;
    const cached = getCache(cacheKey);

    if (cached) {
      res.status(200).json(cached);
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    if (listing.reviews.length < 3) {
      res.status(400).json({
        message: "Not enough reviews to generate a summary (minimum 3 required)",
      });
      return;
    }

    const totalReviews = listing.reviews.length;
    const averageRating =
      Math.round(
        (listing.reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews) *
          10,
      ) / 10;

    const reviewText = listing.reviews
      .map((r) => `${r.user.name} rated ${r.rating}/5: ${r.comment}`)
      .join("\n");

    const raw = await invokeAi([
      new SystemMessage(
        `Summarize Airbnb guest reviews.
Return only JSON with this exact format:
{"summary":"2-3 sentence overall summary","positives":["three praised things"],"negatives":["complaints or empty array"]}
Do not calculate average rating or total reviews.`,
      ),
      new HumanMessage(reviewText),
    ]);

    const parsed =
      parseJsonObject<Pick<ReviewSummary, "summary" | "positives" | "negatives">>(raw);

    const response: ReviewSummary = {
      summary:
        parsed?.summary ??
        "Guests shared generally useful feedback about this listing.",
      positives: Array.isArray(parsed?.positives) ? parsed.positives.slice(0, 3) : [],
      negatives: Array.isArray(parsed?.negatives) ? parsed.negatives : [],
      averageRating,
      totalReviews,
    };

    setCache(cacheKey, response, 600);
    res.status(200).json(response);
  } catch (error) {
    const aiError = getAiErrorResponse(error);
    if (aiError) {
      res.status(aiError.status).json({ message: aiError.message });
      return;
    }
    console.error("Review summary error:", error);
    res.status(500).json({ message: "Error generating review summary" });
  }
};