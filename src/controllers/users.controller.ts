import { Request, Response } from "express";

import { User, users } from "../models/user.model";

const requiredUserFields = ["name", "email", "username", "phone", "role"] as const;

export const getAllUsers = (_req: Request, res: Response): void => {
  res.status(200).json(users);
};

export const getUserById = (req: Request, res: Response): void => {
  const userId = Number(req.params.id);
  const user = users.find((currentUser) => currentUser.id === userId);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(user);
};

export const createUser = (req: Request, res: Response): void => {
  const missingField = requiredUserFields.find((field) => req.body[field] === undefined || req.body[field] === "");

  if (missingField) {
    res.status(400).json({ message: `Missing required field: ${missingField}` });
    return;
  }

  const newUser: User = {
    id: users.length > 0 ? Math.max(...users.map((user) => user.id)) + 1 : 1,
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    phone: req.body.phone,
    role: req.body.role,
    avatar: req.body.avatar,
    bio: req.body.bio
  };

  users.push(newUser);
  res.status(201).json(newUser);
};

export const updateUser = (req: Request, res: Response): void => {
  const userId = Number(req.params.id);
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  users[userIndex] = {
    ...users[userIndex],
    ...req.body,
    id: users[userIndex].id
  };

  res.status(200).json(users[userIndex]);
};

export const deleteUser = (req: Request, res: Response): void => {
  const userId = Number(req.params.id);
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const deletedUser = users.splice(userIndex, 1)[0];
  res.status(200).json({ message: "User deleted successfully", user: deletedUser });
};
