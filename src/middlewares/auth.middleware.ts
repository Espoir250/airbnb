import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-long-random-secret-key";

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers["authorization"];

    // Check authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    // Attach userId and role to request
    req.userId = decoded.userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireHost = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.role === "HOST" || req.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Host role required." });
  }
};

export const requireGuest = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.role === "GUEST" || req.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Guest role required." });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin role required." });
  }
};
