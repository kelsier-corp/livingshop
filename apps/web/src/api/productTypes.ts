import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUpload, toQueryString } from "./client";
import { AttributeDefinition, PageResult, ProductType } from "./types";

export type AttributeDefinitionInput = Omit<AttributeDefinition, "id" | "productTypeId">;
export interface ProductTypeInput {
  name: string;
  description?: string | null;
  basePrice: number;
  categoryIds: string[];
  active?: boolean;
  includeInFactorySheet?: boolean;
  attributeDefinitions: AttributeDefinitionInput[];
}

export interface PercentagePriceIncreaseInput {
  scope: "all" | "categories";
  categoryIds?: string[];
  percentage: number;
}

export interface ProductTypeListParams {
  page: number;
  pageSize: number;
  search?: string;
  categoryIds?: string[];
}

export function fetchProductTypes(params: ProductTypeListParams): Promise<PageResult<ProductType>> {
  return apiGet<PageResult<ProductType>>(`/product-types${toQueryString(params)}`);
}

export function fetchAllProductTypes(): Promise<ProductType[]> {
  return apiGet<ProductType[]>("/product-types/all");
}

export function fetchProductType(id: string): Promise<ProductType> {
  return apiGet<ProductType>(`/product-types/${id}`);
}

export function createProductType(input: ProductTypeInput): Promise<ProductType> {
  return apiPost<ProductType>("/product-types", input);
}

export function updateProductType(id: string, input: ProductTypeInput): Promise<ProductType> {
  return apiPut<ProductType>(`/product-types/${id}`, input);
}

export function deleteProductType(id: string): Promise<void> {
  return apiDelete<void>(`/product-types/${id}`);
}

export function bulkUpdatePrices(prices: { id: string; basePrice: number }[]): Promise<ProductType[]> {
  return apiPatch<ProductType[]>("/product-types/prices/bulk", { prices });
}

export function applyPercentageIncrease(input: PercentagePriceIncreaseInput): Promise<ProductType[]> {
  return apiPatch<ProductType[]>("/product-types/prices/percentage", input);
}

export function uploadProductSketch(id: string, file: File): Promise<ProductType> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ProductType>(`/product-types/${id}/sketch`, formData);
}

export function removeProductSketch(id: string): Promise<ProductType> {
  return apiDelete<ProductType>(`/product-types/${id}/sketch`);
}
