import multer from "multer";
import { ValidationError } from "@domain/errors/DomainError";

// Every image uploaded here (product sketches, order-item reference photos) can end up
// embedded in a printed PDF via @react-pdf/renderer, which only decodes JPEG/PNG — WEBP would
// silently fail to render, so it's not offered as an option anywhere images are attached.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      callback(new ValidationError("Solo se aceptan imágenes JPG o PNG"));
      return;
    }
    callback(null, true);
  },
});
