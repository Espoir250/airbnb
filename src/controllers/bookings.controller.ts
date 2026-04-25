import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { BookingStatus } from "@prisma/client";

export const getAllBookings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        guest: true,
        listing: true,
      },
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        listing: true,
      },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching booking" });
  }
};

export const createBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { listingId, checkIn, checkOut } = req.body;

    // Validate required fields
    if (!listingId || !checkIn || !checkOut) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Parse dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate checkIn is before checkOut
    if (checkInDate >= checkOutDate) {
      res
        .status(400)
        .json({ message: "Check-in date must be before check-out date" });
      return;
    }

    // Validate checkIn is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400).json({ message: "Check-in date must be in the future" });
      return;
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: Number(listingId) },
    });

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    // Check for booking conflicts (overlapping dates with CONFIRMED bookings)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId: Number(listingId),
        status: "CONFIRMED",
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (conflictingBooking) {
      res
        .status(409)
        .json({ message: "Booking conflict: dates already booked" });
      return;
    }

    // Calculate total price server-side
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * listing.pricePerNight;

    // Create booking with PENDING status
    const booking = await prisma.booking.create({
      data: {
        guestId: userId,
        listingId: Number(listingId),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        status: BookingStatus.PENDING,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating booking" });
  }
};

export const updateBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bookingId = Number(req.params.id);
    const userId = (req as any).userId;
    const userRole = (req as any).role;
    const { checkIn, checkOut, totalPrice, status } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check ownership - ADMIN can update any booking
    if (booking.guestId !== userId && userRole !== "ADMIN") {
      res
        .status(403)
        .json({ message: "You can only update your own bookings" });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(totalPrice && { totalPrice: Number(totalPrice) }),
        ...(status && { status: status as BookingStatus }),
      },
    });

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating booking" });
  }
};

export const deleteBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bookingId = Number(req.params.id);
    const userId = (req as any).userId;
    const userRole = (req as any).role;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check ownership - ADMIN can cancel any booking
    if (booking.guestId !== userId && userRole !== "ADMIN") {
      res
        .status(403)
        .json({ message: "You can only cancel your own bookings" });
      return;
    }

    // Check if already cancelled
    if (booking.status === "CANCELLED") {
      res.status(400).json({ message: "Booking is already cancelled" });
      return;
    }

    // Update status to CANCELLED instead of deleting
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling booking" });
  }
};

export const getUserBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: {
        listing: true,
      },
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user bookings" });
  }
};

export const getListingBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const listingId = Number(req.params.listingId);
    const bookings = await prisma.booking.findMany({
      where: { listingId },
      include: {
        guest: true,
      },
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listing bookings" });
  }
};
