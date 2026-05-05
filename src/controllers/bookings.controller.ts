import { Request, Response } from "express";
import { BookingStatus } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { getPagination, getTotalPages } from "../utils/request";

const getNights = (checkIn: Date, checkOut: Date): number =>
  Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

const withTotal = <T extends { totalPrice: number }>(booking: T) => ({
  ...booking,
  total: booking.totalPrice,
});

export const getAllBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        include: {
          guest: { select: { name: true } },
          listing: { select: { title: true, location: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count(),
    ]);

    res.status(200).json({
      data: bookings.map(withTotal),
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
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
    const bookingId = req.params.id as string;
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

    res.status(200).json(withTotal(booking));
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
    const { userId, listingId, checkIn, checkOut, guests } = req.body;

    if (!userId || !listingId || !checkIn || !checkOut || !guests) {
      res.status(400).json({
        message: "userId, listingId, checkIn, checkOut, and guests are required",
      });
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const guestCount = Number(guests);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime()) ||
      checkInDate >= checkOutDate
    ) {
      res
        .status(400)
        .json({ message: "Check-in date must be before check-out date" });
      return;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      res.status(400).json({ message: "Guests must be a positive integer" });
      return;
    }

    const [user, listing] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.listing.findUnique({ where: { id: listingId } }),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!listing) {
      res.status(404).json({ message: "Listing not found" });
      return;
    }

    const nights = getNights(checkInDate, checkOutDate);
    const totalPrice = listing.pricePerNight * nights;

    const booking = await prisma.booking.create({
      data: {
        guestId: userId,
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guestCount,
        totalPrice,
        status: BookingStatus.CONFIRMED,
      },
    });

    res.status(201).json(withTotal(booking));
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
    const bookingId = req.params.id as string;
    const { checkIn, checkOut, totalPrice, status, guests } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(guests && { guests: Number(guests) }),
        ...(totalPrice && { totalPrice: Number(totalPrice) }),
        ...(status && { status: status as BookingStatus }),
      },
    });

    res.status(200).json(withTotal(updatedBooking));
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
    const bookingId = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

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
    const userId = (req.params.id || req.params.userId) as string;
    const { page, limit, skip } = getPagination(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { guestId: userId },
        include: {
          listing: { select: { title: true, location: true, pricePerNight: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where: { guestId: userId } }),
    ]);

    res.status(200).json({
      data: bookings.map(withTotal),
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
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
    const listingId = req.params.listingId as string;
    const { page, limit, skip } = getPagination(req);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { listingId },
        include: {
          guest: { select: { name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where: { listingId } }),
    ]);

    res.status(200).json({
      data: bookings.map(withTotal),
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching listing bookings" });
  }
};
