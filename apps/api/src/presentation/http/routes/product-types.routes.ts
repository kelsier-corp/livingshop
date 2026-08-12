import { Router } from "express";
import { ProductTypesController } from "../controllers/product-types.controller";
import { requireRole } from "../middlewares/requireRole";
import { imageUpload } from "../utils/imageUpload";

export function createProductTypesRouter(controller: ProductTypesController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/all", requireRole("admin", "sales"), controller.listAll);
  router.patch("/prices/bulk", requireRole("admin"), controller.bulkUpdatePrices);
  router.patch("/prices/percentage", requireRole("admin"), controller.applyPercentageIncrease);
  router.get("/:id", requireRole("admin", "sales"), controller.getById);
  router.post("/", requireRole("admin"), controller.create);
  router.put("/:id", requireRole("admin"), controller.update);
  router.delete("/:id", requireRole("admin"), controller.remove);
  router.post("/:id/sketch", requireRole("admin"), imageUpload.single("file"), controller.uploadSketch);
  router.delete("/:id/sketch", requireRole("admin"), controller.removeSketch);
  return router;
}
