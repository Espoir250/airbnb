import { Router } from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  getListingBookings,
  getUserBookings,
  updateBooking,
} from "../../controllers/bookings.controller";

const bookingsRouter = Router();

bookingsRouter.get("/", getAllBookings);
bookingsRouter.get("/user/:userId", getUserBookings);
bookingsRouter.get("/listing/:listingId", getListingBookings);
bookingsRouter.get("/:id", getBookingById);
bookingsRouter.post("/", createBooking);
bookingsRouter.put("/:id", updateBooking);
bookingsRouter.delete("/:id", deleteBooking);

export default bookingsRouter;
