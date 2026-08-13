import { apiDelete, apiGet, apiPost, apiPut, toQueryString } from "./client";
import { PageResult, ProductCategory } from "./types";

export interface ProductCategoryListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export function fetchProductCategories(
  params: ProductCategoryListParams
): Promise<PageResult<ProductCategory>> {
  return apiGet<PageResult<ProductCategory>>(`/product-categories${toQueryString(params)}`);
}

export function fetchAllProductCategories(): Promise<ProductCategory[]> {
  return apiGet<ProductCategory[]>("/product-categories/all");
}

export function createProductCategory(name: string): Promise<ProductCategory> {
  return apiPost<ProductCategory>("/product-categories", { name });
}

export function updateProductCategory(id: string, name: string): Promise<ProductCategory> {
  return apiPut<ProductCategory>(`/product-categories/${id}`, { name });
}

export function deleteProductCategory(id: string): Promise<void> {
  return apiDelete<void>(`/product-categories/${id}`);
}
