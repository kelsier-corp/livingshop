import { z } from "zod";

export const paymentMethodInputSchema = z.object({
  name: z.string().trim().min(1),
});

export const paymentMethodUpdateSchema = z.object({
  name: z.string().trim().min(1),
  active: z.boolean(),
});
