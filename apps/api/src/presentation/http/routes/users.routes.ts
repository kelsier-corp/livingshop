import { Router } from "express";
import { UsersController } from "../controllers/users.controller";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.get("/", controller.list);
  return router;
}
