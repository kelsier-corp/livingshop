import { z } from "zod";
import { ATTRIBUTE_DATA_TYPES } from "@domain/entities/enums";

export const attributeDefinitionInputSchema = z.object({
  name: z.string().trim().min(1),
  dataType: z.enum(ATTRIBUTE_DATA_TYPES),
  attributeCatalogId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
  required: z.boolean().optional(),
});

export const productTypeInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  basePrice: z.number().positive(),
  categoryIds: z.array(z.string().uuid()).default([]),
  active: z.boolean().optional(),
  includeInFactorySheet: z.boolean().optional(),
  attributeDefinitions: z.array(attributeDefinitionInputSchema),
});

export const productTypeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
});

export const productCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
});

export const bulkPriceInputSchema = z.object({
  prices: z.array(
    z.object({
      id: z.string().uuid(),
      basePrice: z.number().positive(),
    })
  ),
});

export const percentagePriceIncreaseInputSchema = z.object({
  scope: z.enum(["all", "categories"]),
  categoryIds: z.array(z.string().uuid()).optional(),
  percentage: z.number(),
});

export const productCategoryInputSchema = z.object({
  name: z.string().trim().min(1),
});

export const attributeCatalogCreateSchema = z.object({
  name: z.string().trim().min(1),
  values: z.array(z.string().trim().min(1)).min(1),
});

export const attributeCatalogUpdateSchema = z.object({
  name: z.string().trim().min(1),
});

export const attributeCatalogValueInputSchema = z.object({
  value: z.string().trim().min(1),
});

export const attributeCatalogValueUpdateSchema = z.object({
  value: z.string().trim().min(1),
  active: z.boolean(),
});
