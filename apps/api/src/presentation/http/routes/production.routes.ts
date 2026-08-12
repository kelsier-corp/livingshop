import { Router } from "express";
import { ProductionController } from "../controllers/production.controller";
import { requireRole } from "../middlewares/requireRole";

export function createProductionRouter(controller: ProductionController): Router {
  const router = Router();
  router.use(requireRole("admin", "sales", "factory"));
  router.get("/board", controller.board);
  router.patch("/items/:itemId/stages/:stage", requireRole("admin", "factory"), controller.toggleStage);
  return router;
}
