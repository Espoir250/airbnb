import { Router } from "express";
import {
  createListing,
  deleteListing,
  getAllListings,
  // getAllListingsAdmin,
  getListingById,
  // getPendingListings,
  // approveListing,
  // rejectListing,
  searchListings,
  updateListing,
} from "../../controllers/listings.controller";
import { createReview, getListingReviews } from "../../controllers/reviews.controller";
import { getListingStats } from "../../controllers/stats.controller";
import { authenticate, requireHost, requireAdmin } from "../../middlewares/auth.middleware";

const listingsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c123
 *         title:
 *           type: string
 *           example: Cozy Beach House
 *         description:
 *           type: string
 *           example: A beautiful beach house with ocean views
 *         price:
 *           type: number
 *           example: 150.00
 *         location:
 *           type: string
 *           example: Malibu, California
 *         hostId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c456
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [wifi, pool, parking]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: [https://example.com/image1.jpg]
 *         maxGuests:
 *           type: integer
 *           example: 6
 *         bedrooms:
 *           type: integer
 *           example: 3
 *         bathrooms:
 *           type: integer
 *           example: 2
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: PENDING
 *     CreateListingInput:
 *       type: object
 *       required: [title, description, price, location, maxGuests, bedrooms, bathrooms]
 *       properties:
 *         title:
 *           type: string
 *           example: Cozy Beach House
 *         description:
 *           type: string
 *           example: A beautiful beach house with ocean views
 *         price:
 *           type: number
 *           example: 150.00
 *         location:
 *           type: string
 *           example: Malibu, California
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [wifi, pool, parking]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: [https://example.com/image1.jpg]
 *         maxGuests:
 *           type: integer
 *           example: 6
 *         bedrooms:
 *           type: integer
 *           example: 3
 *         bathrooms:
 *           type: integer
 *           example: 2
 *     UpdateListingInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Cozy Beach House
 *         description:
 *           type: string
 *           example: A beautiful beach house with ocean views
 *         price:
 *           type: number
 *           example: 150.00
 *         location:
 *           type: string
 *           example: Malibu, California
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: [wifi, pool, parking]
 *         maxGuests:
 *           type: integer
 *           example: 6
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: PENDING
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c999
 *         listingId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c123
 *         userId:
 *           type: string
 *           example: 64a7f9e2b5c3d2a1e8f0c456
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: Amazing place, would visit again!
 *     CreateReviewInput:
 *       type: object
 *       required: [rating, comment]
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: Amazing place, would visit again!
 *     ListingStats:
 *       type: object
 *       properties:
 *         totalListings:
 *           type: integer
 *           example: 120
 *         totalBookings:
 *           type: integer
 *           example: 540
 *         averageRating:
 *           type: number
 *           example: 4.3
 *         totalRevenue:
 *           type: number
 *           example: 85000.00
 */

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: Listing management endpoints
 */

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all approved listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: List of all approved listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 */
listingsRouter.get("/", getAllListings);

/**
 * @swagger
 * /listings/search:
 *   get:
 *     summary: Search approved listings by query parameters
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         description: Number of guests
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date
 *     responses:
 *       200:
 *         description: Filtered list of approved listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 */
listingsRouter.get("/search", searchListings);

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     summary: Get overall listing statistics
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listing statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListingStats'
 *       401:
 *         description: Unauthorized
 */
listingsRouter.get("/stats", getListingStats);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /listings/admin/all:
 *   get:
 *     summary: Get all listings regardless of status (admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Optional filter by status
 *     responses:
 *       200:
 *         description: All listings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
// listingsRouter.get("/admin/all", authenticate, requireAdmin, getAllListingsAdmin);

/**
 * @swagger
 * /listings/admin/pending:
 *   get:
 *     summary: Get all pending listings awaiting approval (admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending listings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
 //listingsRouter.get("/admin/pending", authenticate, requireAdmin, getPendingListings);

/**
 * @swagger
 * /listings/{id}/approve:
 *   patch:
 *     summary: Approve a listing (admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing approved successfully
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
//listingsRouter.patch("/:id/approve", authenticate, requireAdmin, approveListing);

/**
 * @swagger
 * /listings/{id}/reject:
 *   patch:
 *     summary: Reject a listing (admin only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Listing does not meet our quality standards
 *     responses:
 *       200:
 *         description: Listing rejected
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
//listingsRouter.patch("/:id/reject", authenticate, requireAdmin, rejectListing);

// ─── Listing-specific Routes ──────────────────────────────────────────────────

/**
 * @swagger
 * /listings/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       404:
 *         description: Listing not found
 */
listingsRouter.get("/:id/reviews", getListingReviews);

/**
 * @swagger
 * /listings/{id}/reviews:
 *   post:
 *     summary: Create a review for a listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
listingsRouter.post("/:id/reviews", createReview);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 */
listingsRouter.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing (hosts only) - starts as PENDING until admin approves
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Listing submitted and pending approval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - hosts only
 */
listingsRouter.post("/", authenticate, requireHost, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing by ID (resets status to PENDING for re-approval)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
listingsRouter.put("/:id", authenticate, updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing by ID
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       404:
 *         description: Listing not found
 *       401:
 *         description: Unauthorized
 */
listingsRouter.delete("/:id", authenticate, deleteListing);

export default listingsRouter;