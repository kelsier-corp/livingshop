import { apiGet, toQueryString } from "./client";
import { PageResult, SalesRow } from "./types";

export interface SalesListParams {
  page: number;
  pageSize: number;
  customerQuery?: string;
  orderNumber?: number;
}

export function fetchSalesRows(params: SalesListParams): Promise<PageResult<SalesRow>> {
  return apiGet<PageResult<SalesRow>>(`/sales${toQueryString(params)}`);
}
