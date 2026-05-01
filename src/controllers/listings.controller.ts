import { Request, Response } from "express";
import { ListingType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { clearCache, clearCachePattern, getCache, setCache } from "../config/cache";
import { getFirstValue, getPagination, getTotalPages } from "../utils/request";

export const getAllListings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const cacheKey = `listings:page:${page}:limit:${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count(),
    ]);

    const response = {
      data: listings,
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    };

    setCache(cacheKey, response, 60);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listings" });
  }
};

export const searchListings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const location = getFirstValue(req.query.location);
    const type = getFirstValue(req.query.type);
    const minPrice = Number(getFirstValue(req.query.minPrice));
    const maxPrice = Number(getFirstValue(req.query.maxPrice));
    const guests = Number(getFirstValue(req.query.guests));
    const listingType =
      type && type.toUpperCase() in ListingType
        ? (type.toUpperCase() as ListingType)
        : undefined;

    if (type && !listingType) {
      res.status(400).json({ message: "Invalid listing type" });
      return;
    }

    const where: Prisma.ListingWhereInput = {
      ...(location && {
        location: { contains: location, mode: "insensitive" },
      }),
      ...(listingType && { type: listingType }),
      ...((Number.isFinite(minPrice) || Number.isFinite(maxPrice)) && {
        pricePerNight: {
          ...(Number.isFinite(minPrice) && { gte: minPrice }),
          ...(Number.isFinite(maxPrice) && { lte: maxPrice }),
        },
      }),
      ...(Number.isFinite(guests) && { guests: { gte: guests } }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          host: {
            select: { name: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    res.status(200).json({
      data: listings,
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error searching listings" });
  }
};

export const getListingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listingId = req.params.id as string;
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    res.status(200).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listing" });
  }
};

export const createListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      title,
      description,
      location,
      pricePerNight,
      guests,
      type,
      amenities,
      rating,
    } = req.body;
    const userId = (req as any).userId;
    const listingType =
      typeof type === "string" && type.toUpperCase() in ListingType
        ? (type.toUpperCase() as ListingType)
        : undefined;

    // Validate user is authenticated
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !location ||
      !pricePerNight ||
      !guests ||
      !type
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!listingType) {
      res.status(400).json({ message: "Invalid listing type" });
      return;
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight: Number(pricePerNight),
        guests: Number(guests),
        type: listingType,
        amenities: amenities || [],
        rating: rating ? Number(rating) : null,
        hostId: userId,
      },
    });

    clearCachePattern("listings:*");
    clearCache("stats:listings");

    res.status(201).json(listing);
  } catch (error: any) {
    console.error("Create listing error:", error);
    res
      .status(500)
      .json({ message: "Error creating listing", details: error.message });
  }
};

export const updateListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listingId = req.params.id as string;
    const userId = (req as any).userId;
    const userRole = (req as any).role;
    const {
      title,
      description,
      location,
      pricePerNight,
      guests,
      type,
      amenities,
      rating,
    } = req.body;
    const listingType =
      typeof type === "string" && type.toUpperCase() in ListingType
        ? (type.toUpperCase() as ListingType)
        : undefined;

    if (type && !listingType) {
      res.status(400).json({ message: "Invalid listing type" });
      return;
    }

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // Check ownership - ADMIN can edit any listing
    if (listing.hostId !== userId && userRole !== "ADMIN") {
      res.status(403).json({ message: "You can only edit your own listings" });
      return;
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(location && { location }),
        ...(pricePerNight && { pricePerNight: Number(pricePerNight) }),
        ...(guests && { guests: Number(guests) }),
        ...(listingType && { type: listingType }),
        ...(amenities && { amenities }),
        ...(rating && { rating: Number(rating) }),
      },
    });

    clearCachePattern("listings:*");
    clearCache("stats:listings");

    res.status(200).json(updatedListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating listing" });
  }
};

export const deleteListing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listingId = req.params.id as string;
    const userId = (req as any).userId;
    const userRole = (req as any).role;

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // Check ownership - ADMIN can delete any listing
    if (listing.hostId !== userId && userRole !== "ADMIN") {
      res
        .status(403)
        .json({ message: "You can only delete your own listings" });
      return;
    }

    await prisma.listing.delete({
      where: { id: listingId },
    });

    clearCachePattern("listings:*");
    clearCachePattern(`reviews:listing:${listingId}*`);
    clearCache("stats:listings");

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting listing" });
  }
};

