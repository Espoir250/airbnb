import { Router } from "express";
import authRouter from "./auth.routes";
import bookingsRouter from "./bookings.routes";
import listingsRouter from "./listings.routes";
import reviewsRouter from "./reviews.routes";
import uploadRouter from "./upload.routes";
import usersRouter from "./users.routes";
import { deprecateV1 } from "../../middlewares/deprecation.middleware";

const v1Router = Router();

v1Router.use(deprecateV1);
v1Router.use("/auth", authRouter);
v1Router.use("/users", uploadRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/listings", listingsRouter);
v1Router.use("/bookings", bookingsRouter);
v1Router.use("/reviews", reviewsRouter);

export default v1Router;
