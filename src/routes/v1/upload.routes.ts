import { Router } from "express";
import upload from "../../config/multer.js";
import { uploadAvatar } from "../../controllers/upload.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const uploadRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoints
 */

/**
 * @swagger
 * /upload/{id}/avatar:
 *   post:
 *     summary: Upload a profile avatar for a user
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or GIF, max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avatar uploaded successfully
 *                 avatar:
 *                   type: string
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/airbnb/avatars/abc123.jpg
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Upload error
 */
uploadRouter.post("/:id/avatar", authenticate, upload.single("image"), uploadAvatar);

export default uploadRouter;
