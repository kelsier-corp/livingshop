import { Router } from "express";
import { PdfController } from "../controllers/pdf.controller";
import { requireRole } from "../middlewares/requireRole";

export function createPdfRouter(controller: PdfController): Router {
  const router = Router();
  router.get("/orders/:id/order-sheet.pdf", requireRole("admin", "sales"), controller.orderSheet);
  router.get(
    "/orders/:id/factory-sheet.pdf",
    requireRole("admin", "sales", "factory"),
    controller.factorySheet
  );
  router.get(
    "/production/sheet.pdf",
    requireRole("admin", "sales", "factory"),
    controller.productionSheet
  );
  router.get("/sales/sheet.pdf", requireRole("admin", "sales"), controller.salesSheet);
  return router;
}
