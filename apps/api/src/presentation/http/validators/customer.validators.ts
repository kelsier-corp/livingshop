import { z } from "zod";

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export const customerInputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  deliveryAddress: z.string().trim().optional().nullable(),
  mobilePhone: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  invoiceType: z.string().trim().optional().nullable(),
  businessName: z.string().trim().optional().nullable(),
  secondaryPhone: z.string().trim().optional().nullable(),
  invoiceDescription: z.string().trim().optional().nullable(),
});
