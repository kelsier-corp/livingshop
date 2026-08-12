import { User } from "@domain/entities/User";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export {};
