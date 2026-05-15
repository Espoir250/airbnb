import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import compression from "compression";
import cors from "cors";

import v1Router from "./routes/v1";
import { prisma } from "./config/prisma";
import { setupSwagger } from "./config/swagger.js";
import {
  generalRateLimiter,
  strictRateLimiter,
} from "./middlewares/rateLimiter";

const app = express();
const PORT = Number(process.env["PORT"]) || 3000;

// Call after app is created
setupSwagger(app);

/* ✅ ADD CORS HERE (IMPORTANT FIX) */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(compression());
app.use(generalRateLimiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST") {
    strictRateLimiter(req, res, next);
    return;
  }

  next();
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Welcome to Airbnb application");
});

/* API ROUTES */
app.use("/api/v1", v1Router);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

async function connectDb() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("====================================");
    console.log(error);
    console.log("====================================");
  }
}

connectDb();
