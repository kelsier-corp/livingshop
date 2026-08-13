import { Request, Response } from "express";
import { ProductionService } from "@application/production/ProductionService";
import { ProductionStage } from "@domain/entities/enums";
import {
  productionListQuerySchema,
  toggleStageInputSchema,
} from "../validators/production.validators";
import { param } from "../utils/param";

export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  board = async (req: Request, res: Response): Promise<void> => {
    const query = productionListQuerySchema.parse(req.query);
    res.json(await this.productionService.listBoard(query));
  };

  toggleStage = async (req: Request, res: Response): Promise<void> => {
    const { completed } = toggleStageInputSchema.parse(req.body);
    const stage = param(req, "stage") as ProductionStage;
    const result = await this.productionService.toggleStage(
      param(req, "itemId"),
      stage,
      completed,
      req.currentUser?.id ?? null
    );
    res.json(result);
  };
}
