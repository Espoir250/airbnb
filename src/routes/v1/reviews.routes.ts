import { Router } from "express";
import { deleteReview } from "../../controllers/reviews.controller";

const reviewsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DeleteReviewResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Review deleted successfully
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management endpoints
 */

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteReviewResponse'
 *       404:
 *         description: Review not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only delete your own review
 */
reviewsRouter.delete("/:id", deleteReview);

export default reviewsRouter;
