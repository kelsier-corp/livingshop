import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { DomainError } from "@domain/errors/DomainError";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof DomainError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ message: "Invalid request", issues: error.issues });
    return;
  }

  if (error instanceof MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE" ? "El archivo supera el tamaño máximo permitido (8MB)" : error.message;
    res.status(400).json({ message });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
}
