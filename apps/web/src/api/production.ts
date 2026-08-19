import { apiGet, apiPatch, toQueryString } from "./client";
import { OrderItemWithContext, PageResult, ProductionStage, ProductionStageStatus } from "./types";

export interface ProductionListParams {
  page: number;
  pageSize: number;
  deliveryDate?: string;
  number?: number;
}

export function fetchProductionBoard(
  params: ProductionListParams
): Promise<PageResult<OrderItemWithContext>> {
  return apiGet<PageResult<OrderItemWithContext>>(`/production/board${toQueryString(params)}`);
}

export function toggleProductionStage(
  orderItemId: string,
  stage: ProductionStage,
  completed: boolean
): Promise<ProductionStageStatus> {
  return apiPatch<ProductionStageStatus>(`/production/items/${orderItemId}/stages/${stage}`, {
    completed,
  });
}
