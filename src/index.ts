import "dotenv/config";
import express, { Request, Response } from "express";

import listingsRouter from "./routes/listings.routes";
import usersRouter from "./routes/users.routes";
import bookingsRouter from "./routes/bookings.routes";
import authRouter from "./routes/auth.routes";
import { prisma } from "./config/prisma";
import uploadRouter from "./routes/upload.routes.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();
const PORT = process.env.PORT;

// Call after app is created
setupSwagger(app);

app.use(express.json());

app.use("/users", uploadRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Airbnb application");
});

app.use("/users", usersRouter);
app.use("/listings", listingsRouter);
app.use("/bookings", bookingsRouter);
app.use("/auth", authRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "route not found" });
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
