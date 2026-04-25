import { Router } from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  getListingBookings,
  getUserBookings,
  updateBooking,
} from "../controllers/bookings.controller";
import { authenticate, requireGuest } from "../middlewares/auth.middleware";

const bookingsRouter = Router();

bookingsRouter.get("/", authenticate, getAllBookings);
bookingsRouter.get("/:id", authenticate, getBookingById);
bookingsRouter.post("/", authenticate, requireGuest, createBooking);
bookingsRouter.put("/:id", authenticate, updateBooking);
bookingsRouter.delete("/:id", authenticate, deleteBooking);
bookingsRouter.get("/user/:userId", authenticate, getUserBookings);
bookingsRouter.get("/listing/:listingId", authenticate, getListingBookings);

export default bookingsRouter;
