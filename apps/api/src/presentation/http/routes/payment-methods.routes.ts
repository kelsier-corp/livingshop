import { Router } from "express";
import { PaymentMethodsController } from "../controllers/payment-methods.controller";
import { requireRole } from "../middlewares/requireRole";

export function createPaymentMethodsRouter(controller: PaymentMethodsController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.put("/:id", requireRole("admin", "sales"), controller.update);
  router.delete("/:id", requireRole("admin", "sales"), controller.remove);
  return router;
}
