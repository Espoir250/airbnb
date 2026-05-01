import { Router } from "express";
import {
  createListing,
  deleteListing,
  getAllListings,
  getListingById,
  searchListings,
  updateListing,
} from "../../controllers/listings.controller";
import { createReview, getListingReviews } from "../../controllers/reviews.controller";
import { getListingStats } from "../../controllers/stats.controller";
import { authenticate, requireHost } from "../../middlewares/auth.middleware";

const listingsRouter = Router();

listingsRouter.get("/", getAllListings);
listingsRouter.get("/search", searchListings);
listingsRouter.get("/stats", getListingStats);
listingsRouter.get("/:id/reviews", getListingReviews);
listingsRouter.post("/:id/reviews", createReview);
listingsRouter.get("/:id", getListingById);
listingsRouter.post("/", authenticate, requireHost, createListing);
listingsRouter.put("/:id", authenticate, updateListing);
listingsRouter.delete("/:id", authenticate, deleteListing);

export default listingsRouter;
