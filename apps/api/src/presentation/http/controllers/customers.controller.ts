import { Request, Response } from "express";
import { CustomerService } from "@application/customers/CustomerService";
import { customerInputSchema, customerListQuerySchema } from "../validators/customer.validators";
import { param } from "../utils/param";

export class CustomersController {
  constructor(private readonly customerService: CustomerService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = customerListQuerySchema.parse(req.query);
    res.json(await this.customerService.list(query));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.customerService.getById(param(req, "id")));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = customerInputSchema.parse(req.body);
    res.status(201).json(await this.customerService.create(input));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const input = customerInputSchema.parse(req.body);
    res.json(await this.customerService.update(param(req, "id"), input));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.customerService.delete(param(req, "id"));
    res.status(204).send();
  };
}
