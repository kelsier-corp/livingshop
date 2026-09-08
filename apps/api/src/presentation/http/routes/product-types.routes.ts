import { Router } from "express";
import { ProductTypesController } from "../controllers/product-types.controller";
import { requireRole } from "../middlewares/requireRole";
import { imageUpload } from "../utils/imageUpload";

export function createProductTypesRouter(controller: ProductTypesController): Router {
  const router = Router();
  router.get("/", requireRole("admin", "sales"), controller.list);
  router.get("/all", requireRole("admin", "sales"), controller.listAll);
  router.patch("/prices/bulk", requireRole("admin", "sales"), controller.bulkUpdatePrices);
  router.patch(
    "/prices/percentage",
    requireRole("admin", "sales"),
    controller.applyPercentageIncrease
  );
  router.get("/:id", requireRole("admin", "sales"), controller.getById);
  router.post("/", requireRole("admin", "sales"), controller.create);
  router.put("/:id", requireRole("admin", "sales"), controller.update);
  router.delete("/:id", requireRole("admin", "sales"), controller.remove);
  router.post(
    "/:id/sketch",
    requireRole("admin", "sales"),
    imageUpload.single("file"),
    controller.uploadSketch
  );
  router.delete("/:id/sketch", requireRole("admin", "sales"), controller.removeSketch);
  return router;
}
