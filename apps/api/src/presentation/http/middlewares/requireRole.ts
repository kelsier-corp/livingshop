import { NextFunction, Request, Response } from "express";
import { UserRole } from "@domain/entities/enums";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      res.status(403).json({ message: "You don't have permission to perform this action" });
      return;
    }
    next();
  };
}
