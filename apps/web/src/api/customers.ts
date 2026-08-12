import { apiDelete, apiGet, apiPost, apiPut, toQueryString } from "./client";
import { Customer, PageResult } from "./types";

export type CustomerInput = Omit<Customer, "id" | "createdAt">;

export interface CustomerListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export function fetchCustomers(params: CustomerListParams): Promise<PageResult<Customer>> {
  return apiGet<PageResult<Customer>>(`/customers${toQueryString(params)}`);
}

export function fetchCustomer(id: string): Promise<Customer> {
  return apiGet<Customer>(`/customers/${id}`);
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiPost<Customer>("/customers", input);
}

export function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  return apiPut<Customer>(`/customers/${id}`, input);
}

export function deleteCustomer(id: string): Promise<void> {
  return apiDelete<void>(`/customers/${id}`);
}
