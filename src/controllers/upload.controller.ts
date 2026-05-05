import type { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { prisma } from "../config/prisma.js";

// POST /upload/:id/avatar
export async function uploadAvatar(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { url } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");

    await prisma.user.update({
      where: { id },
      data: { avatar: url },
    });

    res.json({ message: "Avatar uploaded successfully", avatar: url });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Error uploading avatar" });
  }
}