import { Router } from "express";

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser
} from "../controllers/users.controller";

const usersRouter = Router();

usersRouter.get("/", getAllUsers);
usersRouter.get("/:id", getUserById);
usersRouter.post("/", createUser);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);

export default usersRouter;
