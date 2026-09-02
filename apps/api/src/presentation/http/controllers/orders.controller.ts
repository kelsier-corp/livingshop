import { Request, Response } from "express";
import { OrderService } from "@application/orders/OrderService";
import { computeOrderTotals } from "@domain/policies/orderTotals";
import { Order } from "@domain/entities/Order";
import { param } from "../utils/param";
import {
  attachmentTypeInputSchema,
  orderInputSchema,
  orderItemActiveInputSchema,
  orderItemAttributesInputSchema,
  orderItemInputSchema,
  orderListQuerySchema,
  orderStatusInputSchema,
  paymentInputSchema,
} from "../validators/order.validators";

// Every role that can reach these routes (admin, sales, factory) sees the same full order —
// factory can view pricing/payments now, it just can't write to any of it. Route-level
// requireRole(...) is what keeps factory off every write endpoint except status.
function toResponseOrder(order: Order) {
  return { ...order, totals: computeOrderTotals(order) };
}

export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = orderListQuerySchema.parse(req.query);
    const page = await this.orderService.list(query);
    res.json({ ...page, items: page.items.map(toResponseOrder) });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.getById(param(req, "id"));
    res.json(toResponseOrder(order));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = orderInputSchema.parse(req.body);
    const order = await this.orderService.create(input);
    res.status(201).json(toResponseOrder(order));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = orderStatusInputSchema.parse(req.body);
    const order = await this.orderService.updateStatus(param(req, "id"), status);
    res.json(toResponseOrder(order));
  };

  addItem = async (req: Request, res: Response): Promise<void> => {
    const input = orderItemInputSchema.parse(req.body);
    const order = await this.orderService.addItem(param(req, "id"), input);
    res.status(201).json(toResponseOrder(order));
  };

  setItemActive = async (req: Request, res: Response): Promise<void> => {
    const { active } = orderItemActiveInputSchema.parse(req.body);
    const order = await this.orderService.setItemActive(
      param(req, "id"),
      param(req, "itemId"),
      active
    );
    res.json(toResponseOrder(order));
  };

  updateItemAttributes = async (req: Request, res: Response): Promise<void> => {
    const input = orderItemAttributesInputSchema.parse(req.body);
    const order = await this.orderService.updateItemAttributes(
      param(req, "id"),
      param(req, "itemId"),
      input
    );
    res.json(toResponseOrder(order));
  };

  addPayment = async (req: Request, res: Response): Promise<void> => {
    const input = paymentInputSchema.parse(req.body);
    res.status(201).json(await this.orderService.addPayment(param(req, "id"), input));
  };

  updatePayment = async (req: Request, res: Response): Promise<void> => {
    const input = paymentInputSchema.parse(req.body);
    const payment = await this.orderService.updatePayment(
      param(req, "id"),
      param(req, "paymentId"),
      input
    );
    res.json(payment);
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
