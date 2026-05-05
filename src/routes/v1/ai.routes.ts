import { Router } from "express";
import {
  smartSearchListings,
  generateListingDescription,
  guestSupportChat,
  recommendListings,
  summarizeListingReviews,
} from "../../controllers/ai.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const aiRouter = Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: Search listings using natural language with pagination
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "apartment in Kigali under $100 for 2 guests"
 *     responses:
 *       200:
 *         description: Listings matching the natural language query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filters:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: string
 *                       nullable: true
 *                     type:
 *                       type: string
 *                       nullable: true
 *                     maxPrice:
 *                       type: number
 *                       nullable: true
 *                     guests:
 *                       type: number
 *                       nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Missing query or no filters could be extracted
 *       500:
 *         description: AI service error
 */
aiRouter.post("/search", smartSearchListings);

/**
 * @swagger
 * /ai/listings/{id}/generate-description:
 *   post:
 *     summary: Generate an AI description for a listing with tone control
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, luxury]
 *                 default: professional
 *                 example: luxury
 *     responses:
 *       200:
 *         description: Generated description and updated listing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 description:
 *                   type: string
 *                 listing:
 *                   type: object
 *       400:
 *         description: Invalid tone value
 *       403:
 *         description: Not the listing owner
 *       404:
 *         description: Listing not found
 *       500:
 *         description: AI service error
 */
aiRouter.post("/listings/:id/generate-description", authenticate, generateListingDescription);

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with the guest support AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "user-123-session-abc"
 *               listingId:
 *                 type: string
 *                 nullable: true
 *                 example: "a3f8c2d1-4b5e-4f6a-8c9d-1e2f3a4b5c6d"
 *               message:
 *                 type: string
 *                 example: "Does this place have WiFi?"
 *     responses:
 *       200:
 *         description: AI chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *                 messageCount:
 *                   type: integer
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Listing not found
 *       500:
 *         description: AI service error
 */
aiRouter.post("/chat", guestSupportChat);

/**
 * @swagger
 * /ai/recommend:
 *   post:
 *     summary: Get AI listing recommendations based on booking history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended listings based on user booking history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preferences:
 *                   type: string
 *                 reason:
 *                   type: string
 *                 searchFilters:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: string
 *                       nullable: true
 *                     type:
 *                       type: string
 *                       nullable: true
 *                     maxPrice:
 *                       type: number
 *                       nullable: true
 *                     guests:
 *                       type: number
 *                       nullable: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: No booking history found
 *       404:
 *         description: User not found
 *       500:
 *         description: AI service error
 */
aiRouter.post("/recommend", authenticate, recommendListings);

/**
 * @swagger
 * /ai/listings/{id}/review-summary:
 *   get:
 *     summary: Get an AI-generated summary of listing reviews
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: AI-generated review summary (cached for 10 minutes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                 positives:
 *                   type: array
 *                   items:
 *                     type: string
 *                 negatives:
 *                   type: array
 *                   items:
 *                     type: string
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: integer
 *       400:
 *         description: Not enough reviews (minimum 3 required)
 *       404:
 *         description: Listing not found
 *       500:
 *         description: AI service error
 */
aiRouter.get("/listings/:id/review-summary", summarizeListingReviews);

export default aiRouter;