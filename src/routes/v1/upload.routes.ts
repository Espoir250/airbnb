import { Router } from "express";
import upload from "../../config/multer.js";
import { uploadAvatar } from "../../controllers/upload.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const uploadRouter = Router();

uploadRouter.post("/:id/avatar", authenticate, upload.single("image"), uploadAvatar);

export default uploadRouter;
