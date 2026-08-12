import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { requireRole } from "../middlewares/requireRole";
import { imageUpload } from "../utils/imageUpload";

export function createOrdersRouter(controller: OrdersController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales", "factory"), controller.list);
  router.get("/:id", requireRole("admin", "sales", "factory"), controller.getById);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.patch("/:id/status", requireRole("admin", "sales"), controller.updateStatus);
  router.post("/:id/payments", requireRole("admin", "sales"), controller.addPayment);
  router.post(
    "/items/:itemId/attachments",
    requireRole("admin", "sales"),
    imageUpload.single("file"),
    controller.addAttachment
  );
  router.delete(
    "/attachments/:attachmentId",
    requireRole("admin", "sales"),
    controller.removeAttachment
  );
  return router;
}
