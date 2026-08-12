import { Router } from "express";
import { AttributeCatalogsController } from "../controllers/attribute-catalogs.controller";
import { requireRole } from "../middlewares/requireRole";

export function createAttributeCatalogsRouter(controller: AttributeCatalogsController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/:id", requireRole("admin", "sales"), controller.getById);
  router.post("/", requireRole("admin"), controller.create);
  router.put("/:id", requireRole("admin"), controller.update);
  router.delete("/:id", requireRole("admin"), controller.remove);
  router.post("/:id/values", requireRole("admin"), controller.addValue);
  router.put("/:id/values/:valueId", requireRole("admin"), controller.updateValue);
  router.delete("/:id/values/:valueId", requireRole("admin"), controller.removeValue);
  return router;
}
