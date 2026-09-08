import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { requireRole } from "../middlewares/requireRole";

// Public and unauthenticated on purpose: it backs the mock login/user-switcher dropdown, which has
// to work before there's a currentUser to check a role against. Never add requireRole here.
export function createUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.get("/", controller.list);
  return router;
}

// The admin-only "Usuarios" tab reuses the same list handler, but behind currentUserMiddleware +
// requireRole — this is what actually enforces "admin sees the user list" at the data layer,
// not just by hiding the tab in the nav.
export function createAdminUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.get("/", requireRole("admin"), controller.list);
  return router;
}
