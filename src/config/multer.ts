import multer, { FileFilterCallback } from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
}

const upload = multer({
  storage,
  fileFilter,

  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
