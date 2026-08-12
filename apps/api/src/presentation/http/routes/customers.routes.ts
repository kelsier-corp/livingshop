import { Router } from "express";
import { CustomersController } from "../controllers/customers.controller";
import { requireRole } from "../middlewares/requireRole";

export function createCustomersRouter(controller: CustomersController): Router {
  const router = Router();
  router.use(requireRole("admin", "sales"));
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);
  return router;
}
