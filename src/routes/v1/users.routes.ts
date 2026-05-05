import { Router } from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../../controllers/users.controller";
import { getUserBookings } from "../../controllers/bookings.controller";
import { getUserStats } from "../../controllers/stats.controller";
//import { getAvatar } from "../../controllers/upload.controller";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const usersRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: clh3k2j0x0000abc123
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         username:
 *           type: string
 *           example: johndoe
 *         phone:
 *           type: string
 *           example: "07865432"
 *         role:
 *           type: string
 *           enum: [GUEST, HOST, ADMIN]
 *           example: GUEST
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/your-cloud/image/upload/airbnb/avatars/abc123.jpg
 *         bio:
 *           type: string
 *           nullable: true
 *           example: I love travelling
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00Z
 *     CreateUserInput:
 *       type: object
 *       required: [name, email, password, username, phone]
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         password:
 *           type: string
 *           example: password123
 *         username:
 *           type: string
 *           example: johndoe
 *         phone:
 *           type: string
 *           example: "07865432"
 *         role:
 *           type: string
 *           enum: [GUEST, HOST, ADMIN]
 *           example: GUEST
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         username:
 *           type: string
 *           example: johndoe
 *         phone:
 *           type: string
 *           example: "07865432"
 *         bio:
 *           type: string
 *           example: I love travelling
 *         role:
 *           type: string
 *           enum: [GUEST, HOST, ADMIN]
 *           example: HOST
 *     UserStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 320
 *         totalGuests:
 *           type: integer
 *           example: 250
 *         totalHosts:
 *           type: integer
 *           example: 65
 *         totalAdmins:
 *           type: integer
 *           example: 5
 *         newUsersThisMonth:
 *           type: integer
 *           example: 28
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
usersRouter.get("/", getAllUsers);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get overall user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStats'
 *       401:
 *         description: Unauthorized
 */
usersRouter.get("/stats", getUserStats);

/**
 * @swagger
 * /users/{id}/bookings:
 *   get:
 *     summary: Get all bookings for a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of bookings for the user
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
usersRouter.get("/:id/bookings", getUserBookings);

/**
 * @swagger
 * /users/{id}/avatar:
 *   get:
 *     summary: Get avatar URL for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Avatar URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                   example: https://res.cloudinary.com/your-cloud/image/upload/airbnb/avatars/abc123.jpg
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// usersRouter.get("/:id/avatar", getAvatar);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
usersRouter.get("/:id", getUserById);

/**
 * @swagger
 * /users/create:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
usersRouter.post("/create", createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
usersRouter.put("/:id", authenticate, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admins only
 */
usersRouter.delete("/:id", authenticate, requireAdmin, deleteUser);

export default usersRouter;
