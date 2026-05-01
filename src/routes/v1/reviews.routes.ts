import { Router } from "express";
import { deleteReview } from "../../controllers/reviews.controller";

const reviewsRouter = Router();

reviewsRouter.delete("/:id", deleteReview);

export default reviewsRouter;
