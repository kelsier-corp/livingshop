import { Request, Response } from "express";
import { PaymentMethodService } from "@application/payment-methods/PaymentMethodService";
import { param } from "../utils/param";
import { paymentMethodInputSchema, paymentMethodUpdateSchema } from "../validators/payment-method.validators";

export class PaymentMethodsController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.paymentMethodService.list());
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { name } = paymentMethodInputSchema.parse(req.body);
    res.status(201).json(await this.paymentMethodService.create(name));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { name, active } = paymentMethodUpdateSchema.parse(req.body);
    res.json(await this.paymentMethodService.update(param(req, "id"), name, active));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.paymentMethodService.delete(param(req, "id"));
    res.status(204).send();
  };
}
