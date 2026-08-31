import { Request, Response } from "express";
import { OrderService } from "@application/orders/OrderService";
import { toFactoryOrderView } from "@domain/policies/factoryView";
import { computeOrderTotals } from "@domain/policies/orderTotals";
import { Order } from "@domain/entities/Order";
import { param } from "../utils/param";
import {
  attachmentTypeInputSchema,
  orderInputSchema,
  orderListQuerySchema,
  orderStatusInputSchema,
  paymentInputSchema,
} from "../validators/order.validators";

function toResponseOrder(order: Order, isFactory: boolean) {
  if (isFactory) return toFactoryOrderView(order);
  return { ...order, totals: computeOrderTotals(order) };
}

export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const isFactory = req.currentUser?.role === "factory";
    const query = orderListQuerySchema.parse(req.query);
    const page = await this.orderService.list(query);
    res.json({ ...page, items: page.items.map((order) => toResponseOrder(order, isFactory)) });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const isFactory = req.currentUser?.role === "factory";
    const order = await this.orderService.getById(param(req, "id"));
    res.json(toResponseOrder(order, isFactory));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = orderInputSchema.parse(req.body);
    const order = await this.orderService.create(input);
    res.status(201).json(toResponseOrder(order, false));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const isFactory = req.currentUser?.role === "factory";
    const { status } = orderStatusInputSchema.parse(req.body);
    const order = await this.orderService.updateStatus(
      param(req, "id"),
      status,
      req.currentUser!.role
    );
    res.json(toResponseOrder(order, isFactory));
  };

  addPayment = async (req: Request, res: Response): Promise<void> => {
    const input = paymentInputSchema.parse(req.body);
    res.status(201).json(await this.orderService.addPayment(param(req, "id"), input));
  };

  addAttachment = async (req: Request, res: Response): Promise<void> => {
    const { type } = attachmentTypeInputSchema.parse(req.body);
    if (!req.file) {
      res.status(400).json({ message: "A file is required" });
      return;
    }
    const attachment = await this.orderService.addAttachment(param(req, "itemId"), type, {
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });
    res.status(201).json(attachment);
  };

  removeAttachment = async (req: Request, res: Response): Promise<void> => {
    await this.orderService.deleteAttachment(param(req, "attachmentId"));
    res.status(204).send();
  };
}
