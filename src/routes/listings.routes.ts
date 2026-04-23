import { Router } from "express";

import {
  createListing,
  deleteListing,
  getAllListings,
  getListingById,
  updateListing
} from "../controllers/listings.controller";

const listingsRouter = Router();

listingsRouter.get("/", getAllListings);
listingsRouter.get("/:id", getListingById);
listingsRouter.post("/", createListing);
listingsRouter.put("/:id", updateListing);
listingsRouter.delete("/:id", deleteListing);

export default listingsRouter;
