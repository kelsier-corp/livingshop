import { Request, Response } from "express";
import { AttributeCatalogService } from "@application/attribute-catalogs/AttributeCatalogService";
import { param } from "../utils/param";
import {
  attributeCatalogInputSchema,
  attributeCatalogValueInputSchema,
  attributeCatalogValueUpdateSchema,
} from "../validators/catalog.validators";

export class AttributeCatalogsController {
  constructor(private readonly attributeCatalogService: AttributeCatalogService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.attributeCatalogService.list());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.attributeCatalogService.getById(param(req, "id")));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { name } = attributeCatalogInputSchema.parse(req.body);
    res.status(201).json(await this.attributeCatalogService.create(name));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { name } = attributeCatalogInputSchema.parse(req.body);
    res.json(await this.attributeCatalogService.update(param(req, "id"), name));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.attributeCatalogService.delete(param(req, "id"));
    res.status(204).send();
  };

  addValue = async (req: Request, res: Response): Promise<void> => {
    const { value } = attributeCatalogValueInputSchema.parse(req.body);
    res.status(201).json(await this.attributeCatalogService.addValue(param(req, "id"), value));
  };

  updateValue = async (req: Request, res: Response): Promise<void> => {
    const { value, active } = attributeCatalogValueUpdateSchema.parse(req.body);
    res.json(await this.attributeCatalogService.updateValue(param(req, "valueId"), value, active));
  };

  removeValue = async (req: Request, res: Response): Promise<void> => {
    await this.attributeCatalogService.deleteValue(param(req, "valueId"));
    res.status(204).send();
  };
}
