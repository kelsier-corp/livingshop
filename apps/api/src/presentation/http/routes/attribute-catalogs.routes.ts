import { Router } from "express";
import { AttributeCatalogsController } from "../controllers/attribute-catalogs.controller";
import { requireRole } from "../middlewares/requireRole";

export function createAttributeCatalogsRouter(controller: AttributeCatalogsController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/all", requireRole("admin", "sales"), controller.listAll);
  router.get("/:id", requireRole("admin", "sales"), controller.getById);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.put("/:id", requireRole("admin", "sales"), controller.update);
  router.delete("/:id", requireRole("admin", "sales"), controller.remove);
  router.post("/:id/values", requireRole("admin", "sales"), controller.addValue);
  router.put("/:id/values/:valueId", requireRole("admin", "sales"), controller.updateValue);
  router.delete("/:id/values/:valueId", requireRole("admin", "sales"), controller.removeValue);
  return router;
}
