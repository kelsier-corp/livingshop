import { Router } from "express";
import { SalesController } from "../controllers/sales.controller";
import { requireRole } from "../middlewares/requireRole";

export function createSalesRouter(controller: SalesController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/sheet.xlsx", requireRole("admin", "sales"), controller.exportWeeklySheet);
  return router;
}
