import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { clearCache } from "../config/cache";
import { getPagination, getTotalPages } from "../utils/request";

export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.status(200).json({
      data: users,
      meta: { total, page, limit, totalPages: getTotalPages(total, limit) },
    });
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
    const userId = req.params.id as string;
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
    const userRole =
      typeof role === "string" && role.toUpperCase() in Role
        ? (role.toUpperCase() as Role)
        : Role.GUEST;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        bio,
        phone,
        password: "defaultpassword", // In a real application, you should hash the password and not use a default value
        role: userRole,
      },
    });

    clearCache("stats:users");
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
    const userId = req.params.id as string;
    const { name, email, username, bio, phone, role } = req.body;

    // Get the authenticated user ID from the request
    const authenticatedUserId = (req as any).userId;
    const authenticatedUserRole = (req as any).role;

    // Check if user is updating their own profile or is an admin
    if (userId !== authenticatedUserId && authenticatedUserRole !== "ADMIN") {
      res.status(403).json({ message: "You can only update your own profile" });
      return;
    }

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

    clearCache("stats:users");
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
    const userId = req.params.id as string;
    const authenticatedUserRole = (req as any).role;

    // Only admins can delete users
    if (authenticatedUserRole !== "ADMIN") {
      res.status(403).json({ message: "Only admins can delete users" });
      return;
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    clearCache("stats:users");
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(404).json({ message: "User not found" });
  }
};
