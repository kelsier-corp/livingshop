import { z } from "zod";

export const salesListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  customerQuery: z.string().trim().optional(),
  orderNumber: z.coerce.number().int().positive().optional(),
});
