import { Request, Response } from "express";

import { Listing, listings } from "../models/listing.model";

const requiredListingFields = [
  "title",
  "description",
  "location",
  "pricePerNight",
  "guests",
  "type",
  "amenities",
  "host"
] as const;

export const getAllListings = (_req: Request, res: Response): void => {
  res.status(200).json(listings);
};

export const getListingById = (req: Request, res: Response): void => {
  const listingId = Number(req.params.id);
  const listing = listings.find((currentListing) => currentListing.id === listingId);

  if (!listing) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  res.status(200).json(listing);
};

export const createListing = (req: Request, res: Response): void => {
  const missingField = requiredListingFields.find((field) => {
    const value = req.body[field];
    return value === undefined || value === "" || (field === "amenities" && !Array.isArray(value));
  });

  if (missingField) {
    res.status(400).json({ message: `Missing or invalid required field: ${missingField}` });
    return;
  }

  const newListing: Listing = {
    id: listings.length > 0 ? Math.max(...listings.map((listing) => listing.id)) + 1 : 1,
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    pricePerNight: req.body.pricePerNight,
    guests: req.body.guests,
    type: req.body.type,
    amenities: req.body.amenities,
    rating: req.body.rating,
    host: req.body.host
  };

  listings.push(newListing);
  res.status(201).json(newListing);
};

export const updateListing = (req: Request, res: Response): void => {
  const listingId = Number(req.params.id);
  const listingIndex = listings.findIndex((listing) => listing.id === listingId);

  if (listingIndex === -1) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  listings[listingIndex] = {
    ...listings[listingIndex],
    ...req.body,
    id: listings[listingIndex].id
  };

  res.status(200).json(listings[listingIndex]);
};

export const deleteListing = (req: Request, res: Response): void => {
  const listingId = Number(req.params.id);
  const listingIndex = listings.findIndex((listing) => listing.id === listingId);

  if (listingIndex === -1) {
    res.status(404).json({ message: "Listing not found" });
    return;
  }

  const deletedListing = listings.splice(listingIndex, 1)[0];
  res.status(200).json({ message: "Listing deleted successfully", listing: deletedListing });
};
