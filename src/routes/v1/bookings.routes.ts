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

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c123
 *         userId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c456
 *         listingId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c789
 *         checkIn:
 *           type: string
 *           format: date
 *           example: 2024-06-01
 *         checkOut:
 *           type: string
 *           format: date
 *           example: 2024-06-07
 *         totalPrice:
 *           type: number
 *           example: 350.00
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           example: confirmed
 *     CreateBookingInput:
 *       type: object
 *       required: [userId, listingId, checkIn, checkOut]
 *       properties:
 *         userId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c456
 *         listingId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c789
 *         checkIn:
 *           type: string
 *           format: date
 *           example: 2024-06-01
 *         checkOut:
 *           type: string
 *           format: date
 *           example: 2024-06-07
 *     UpdateBookingInput:
 *       type: object
 *       properties:
 *         checkIn:
 *           type: string
 *           format: date
 *           example: 2024-06-01
 *         checkOut:
 *           type: string
 *           format: date
 *           example: 2024-06-07
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           example: confirmed
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.get("/", getAllBookings);

/**
 * @swagger
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get all bookings for a specific user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of bookings for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.get("/user/:userId", getUserBookings);

/**
 * @swagger
 * /bookings/listing/{listingId}:
 *   get:
 *     summary: Get all bookings for a specific listing
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: List of bookings for the listing
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.get("/listing/:listingId", getListingBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.get("/:id", getBookingById);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.post("/", createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingInput'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.put("/:id", updateBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
bookingsRouter.delete("/:id", deleteBooking);

export default bookingsRouter;
