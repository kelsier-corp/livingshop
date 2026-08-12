import { z } from "zod";

export const toggleStageInputSchema = z.object({
  completed: z.boolean(),
});

export const productionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
