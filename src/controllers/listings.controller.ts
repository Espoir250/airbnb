import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getAllListings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listings = await prisma.listing.findMany();
    res.status(200).json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listings" });
  }
};

export const getListingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listingId = Number(req.params.id);
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

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight: Number(pricePerNight),
        guests: Number(guests),
        type,
        amenities: amenities || [],
        rating: rating ? Number(rating) : null,
        hostId: userId,
      },
    });

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
    const listingId = Number(req.params.id);
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
        ...(type && { type }),
        ...(amenities && { amenities }),
        ...(rating && { rating: Number(rating) }),
      },
    });

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
    const listingId = Number(req.params.id);
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

    res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting listing" });
  }
};
