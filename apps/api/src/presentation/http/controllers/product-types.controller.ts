import { Request, Response } from "express";
import { ProductTypeService } from "@application/catalog/ProductTypeService";
import {
  bulkPriceInputSchema,
  percentagePriceIncreaseInputSchema,
  productTypeInputSchema,
  productTypeListQuerySchema,
} from "../validators/catalog.validators";
import { param } from "../utils/param";

export class ProductTypesController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = productTypeListQuerySchema.parse(req.query);
    res.json(await this.productTypeService.list(query));
  };

  listAll = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.productTypeService.listAll());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.productTypeService.getById(param(req, "id")));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = productTypeInputSchema.parse(req.body);
    res.status(201).json(await this.productTypeService.create(input));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const input = productTypeInputSchema.parse(req.body);
    res.json(await this.productTypeService.update(param(req, "id"), input));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.productTypeService.delete(param(req, "id"));
    res.status(204).send();
  };

  bulkUpdatePrices = async (req: Request, res: Response): Promise<void> => {
    const { prices } = bulkPriceInputSchema.parse(req.body);
    res.json(await this.productTypeService.bulkUpdatePrices(prices));
  };

  applyPercentageIncrease = async (req: Request, res: Response): Promise<void> => {
    const input = percentagePriceIncreaseInputSchema.parse(req.body);
    res.json(await this.productTypeService.applyPercentageIncrease(input));
  };

  uploadSketch = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: "A file is required" });
      return;
    }
    const productType = await this.productTypeService.uploadSketch(param(req, "id"), {
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });
    res.json(productType);
  };

  removeSketch = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.productTypeService.removeSketch(param(req, "id")));
  };
}
