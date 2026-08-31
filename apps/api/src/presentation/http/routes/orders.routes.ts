import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { requireRole } from "../middlewares/requireRole";
import { imageUpload } from "../utils/imageUpload";

export function createOrdersRouter(controller: OrdersController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales", "factory"), controller.list);
  router.get("/:id", requireRole("admin", "sales", "factory"), controller.getById);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.patch("/:id/status", requireRole("admin", "sales", "factory"), controller.updateStatus);
  router.post("/:id/items", requireRole("admin", "sales"), controller.addItem);
  // PATCH rather than DELETE: taking a product off the order flips OrderItem.active, it never
  // deletes the row (see schema.prisma), and the same route puts it back with active: true.
  router.patch("/:id/items/:itemId", requireRole("admin", "sales"), controller.setItemActive);
  router.post("/:id/payments", requireRole("admin", "sales"), controller.addPayment);
  router.patch("/:id/payments/:paymentId", requireRole("admin", "sales"), controller.updatePayment);
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
