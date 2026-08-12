import { Request, Response } from "express";
import { ProductCategoryService } from "@application/catalog/ProductCategoryService";
import { productCategoryInputSchema, productCategoryListQuerySchema } from "../validators/catalog.validators";
import { param } from "../utils/param";

export class ProductCategoriesController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = productCategoryListQuerySchema.parse(req.query);
    res.json(await this.productCategoryService.list(query));
  };

  listAll = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.productCategoryService.listAll());
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { name } = productCategoryInputSchema.parse(req.body);
    res.status(201).json(await this.productCategoryService.create(name));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { name } = productCategoryInputSchema.parse(req.body);
    res.json(await this.productCategoryService.update(param(req, "id"), name));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.productCategoryService.delete(param(req, "id"));
    res.status(204).send();
  };
}
