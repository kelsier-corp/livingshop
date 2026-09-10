import { Router } from "express";
import { ProductCategoriesController } from "../controllers/product-categories.controller";
import { requireRole } from "../middlewares/requireRole";

export function createProductCategoriesRouter(controller: ProductCategoriesController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/all", requireRole("admin", "sales"), controller.listAll);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.put("/:id", requireRole("admin", "sales"), controller.update);
  router.delete("/:id", requireRole("admin", "sales"), controller.remove);
  return router;
}
