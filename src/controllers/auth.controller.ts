import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, username, password, role } = req.body;

    // Validate all fields are present
    if (!name || !email || !username || !password) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate password is at least 8 characters
    if (password.length < 8) {
      res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
      return;
    }

    // Check if email or username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({ message: "Email or username already taken" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role (only HOST or GUEST allowed via API)
    const userRole = role === "HOST" ? "HOST" : "GUEST";

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone: req.body.phone || "",
        password: hashedPassword,
        role: userRole,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET as string,
      {
        expiresIn: JWT_EXPIRES_IN as any,
      },
    );

    // Return token and user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: true,
        bookings: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    // Validate both fields present
    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Current password and new password are required" });
      return;
    }

    // Validate new password is at least 8 characters
    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
      return;
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error changing password" });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    // Always return same response whether email exists or not
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generate raw token
      const rawToken = crypto.randomBytes(32).toString("hex");
      // Hash before storing
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      // Set expiry to 1 hour from now
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      // Save hashed token and expiry
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry,
        },
      });

      // In production, send this via email
      // For now, we'll log it to console
      console.log(
        `Password reset link: http://localhost:3000/auth/reset-password/${rawToken}`,
      );
    }

    // Always return same message
    res.status(200).json({
      message: "If that email is registered, a reset link has been sent",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error processing forgot password request" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate new password is at least 8 characters
    if (!newPassword || newPassword.length < 8) {
      res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
      return;
    }

    // Hash the raw token
    const hashedToken = crypto
      .createHash("sha256")
      .update("token")
      .digest("hex");

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user: set new password, clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
