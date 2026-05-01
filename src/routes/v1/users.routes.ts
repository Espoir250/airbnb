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
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const usersRouter = Router();

usersRouter.get("/", getAllUsers);
usersRouter.get("/stats", getUserStats);
usersRouter.get("/:id/bookings", getUserBookings);
usersRouter.get("/:id", getUserById);
usersRouter.post("/create", createUser);
usersRouter.put("/:id", authenticate, updateUser);
usersRouter.delete("/:id", authenticate, requireAdmin, deleteUser);

export default usersRouter;
