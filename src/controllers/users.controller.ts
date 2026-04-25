import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, username, bio, phone, role } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        bio,
        phone,
        password: "defaultpassword", // In a real application, you should hash the password and not use a default value
        role: role || "guest",
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating user" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    const { name, email, username, bio, phone, role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(phone && { phone }),
        ...(role && { role }),
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "User not found" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = Number(req.params.id);

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "User not found" });
  }
};
