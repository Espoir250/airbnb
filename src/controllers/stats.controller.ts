import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getCache, setCache } from "../config/cache";

export const getListingStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cacheKey = "stats:listings";
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    const [totalListings, average, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({
        _avg: { pricePerNight: true },
      }),
      prisma.listing.groupBy({
        by: ["location"],
        _count: { location: true },
        orderBy: { _count: { location: "desc" } },
      }),
      prisma.listing.groupBy({
        by: ["type"],
        _count: { type: true },
        orderBy: { _count: { type: "desc" } },
      }),
    ]);

    const response = {
      totalListings,
      averagePrice: average._avg.pricePerNight ?? 0,
      byLocation,
      byType,
    };

    setCache(cacheKey, response, 300);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listing stats" });
  }
};

export const getUserStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cacheKey = "stats:users";
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      res.status(200).json(cachedData);
      return;
    }

    const [totalUsers, byRole] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
        orderBy: { _count: { role: "desc" } },
      }),
    ]);

    const response = { totalUsers, byRole };

    setCache(cacheKey, response, 300);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user stats" });
  }
};
