import { Router } from "express";
import authRouter from "./auth.routes";
import aiRouter from "./ai.routes";
import bookingsRouter from "./bookings.routes";
import listingsRouter from "./listings.routes";
import reviewsRouter from "./reviews.routes";
import uploadRouter from "./upload.routes";
import usersRouter from "./users.routes";
import contactRouter from "./contact.routes";  // ✅ add this
import { deprecateV1 } from "../../middlewares/deprecation.middleware";

const v1Router = Router();

v1Router.use(deprecateV1);
v1Router.use("/ai", aiRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/upload", uploadRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/listings", listingsRouter);
v1Router.use("/bookings", bookingsRouter);
v1Router.use("/reviews", reviewsRouter);
v1Router.use("/contact", contactRouter);  // ✅ add this

export default v1Router;