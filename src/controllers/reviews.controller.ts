import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getCache, setCache, clearCachePattern } from "../config/cache";
import { getFirstValue, getPagination, getTotalPages } from "../utils/request";

/**
 * Get all reviews for a listing (paginated)
 * GET /listings/:id/reviews
 */
export const getListingReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getFirstValue(req.params.id);
    const listingId = id as string;
    const { page, limit, skip } = getPagination(req);

    // Check cache first (30 seconds TTL)
    const cacheKey = `reviews:listing:${listingId}:page:${page}:limit:${limit}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    // Use Promise.all to fetch reviews and count in parallel
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { listingId },
        include: {
          user: {
            select: { name: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({
        where: { listingId },
      }),
    ]);

    const response = {
      data: reviews,
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    };

    // Cache for 30 seconds
    setCache(cacheKey, response, 30);

    res.json(response);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

/**
 * Add a review to a listing
 * POST /listings/:id/reviews
 */
export const createReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getFirstValue(req.params.id);
    const listingId = id as string;
    const { userId, rating, comment } = req.body;
    const reviewRating = Number(rating);

    // Validate required fields
    if (!userId || !rating || !comment) {
      res
        .status(400)
        .json({ error: "userId, rating, and comment are required" });
      return;
    }

    // Validate rating range
    if (!Number.isInteger(reviewRating) || reviewRating < 1 || reviewRating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5" });
      return;
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: reviewRating,
        comment,
        userId,
        listingId,
      },
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
    });

    // Clear cache for this listing's reviews
    clearCachePattern(`reviews:listing:${listingId}*`);

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

/**
 * Delete a review
 * DELETE /reviews/:id
 */
export const deleteReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getFirstValue(req.params.id);
    const reviewId = id as string;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Clear cache for this listing's reviews
    clearCachePattern(`reviews:listing:${review.listingId}*`);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

export default {
  getListingReviews,
  createReview,
  deleteReview,
};
