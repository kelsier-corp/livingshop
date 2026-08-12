import { Request, Response } from "express";
import { SalesService } from "@application/sales/SalesService";
import { salesListQuerySchema } from "../validators/sales.validators";

export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = salesListQuerySchema.parse(req.query);
    res.json(await this.salesService.list(query));
  };
}
