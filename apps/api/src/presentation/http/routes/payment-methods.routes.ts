import { Router } from "express";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { requireRole } from "../middlewares/requireRole";

export function createPaymentMethodsRouter(controller: PaymentMethodsController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.post("/", requireRole("admin"), controller.create);
  router.put("/:id", requireRole("admin"), controller.update);
  router.delete("/:id", requireRole("admin"), controller.remove);
  return router;
}
