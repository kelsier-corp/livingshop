import { z } from "zod";
import { ORDER_STATUSES } from "@domain/entities/enums";

export const orderItemInputSchema = z.object({
  productTypeId: z.string().uuid(),
  quantity: z.number().int().positive(),
  deliveryDate: z.coerce.date(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  factoryNotes: z.string().trim().optional().nullable(),
});

export const orderInputSchema = z.object({
  customerId: z.string().uuid(),
  salespersonId: z.string().uuid(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1),
});

export const orderStatusInputSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const paymentInputSchema = z.object({
  amount: z.number().positive(),
  method: z.string().trim().min(1),
  feePct: z.number().min(0).optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

// Sketches now live on the ProductType (see product-types.routes.ts) — an order item can only
// attach reference photos of that specific sale (e.g. the fabric that actually arrived).
export const attachmentTypeInputSchema = z.object({
  type: z.literal("reference_photo"),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  number: z.coerce.number().int().positive().optional(),
  customerQuery: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["date", "number", "deliveryDate"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});
