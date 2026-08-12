import { NextFunction, Request, Response } from "express";
import { UserRepository } from "@domain/repositories/UserRepository";

export function createCurrentUserMiddleware(userRepository: UserRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // PDF links are plain <a href target="_blank"> browser navigations, which can't carry a
    // custom header — the frontend falls back to a ?userId= query param for those, so accept
    // either here.
    const userId = req.header("x-user-id") ?? (req.query.userId as string | undefined);
    if (!userId) {
      res.status(401).json({ message: "Missing x-user-id header" });
      return;
    }

    const user = await userRepository.findById(userId);
    if (!user || !user.active) {
      res.status(401).json({ message: "Unknown or inactive user" });
      return;
    }

    req.currentUser = user;
    next();
  };
}
