import { apiDelete, apiGet, apiPatch, apiPost, apiUpload, toQueryString } from "./client";
import { AttachmentType, AttributeValues, Order, OrderStatus, PageResult, Payment } from "./types";

export interface OrderItemInput {
  productTypeId: string;
  quantity: number;
  deliveryDate: string;
  attributes: AttributeValues;
  factoryNotes?: string | null;
}

export interface OrderInput {
  customerId: string;
  salespersonId: string;
  notes?: string | null;
  items: OrderItemInput[];
}

export interface OrderListParams {
  page: number;
  pageSize: number;
  number?: number;
  customerQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "number" | "deliveryDate";
  sortDirection?: "asc" | "desc";
}

export function fetchOrders(params: OrderListParams): Promise<PageResult<Order>> {
  return apiGet<PageResult<Order>>(`/orders${toQueryString(params)}`);
}

export function fetchOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/orders/${id}`);
}

export function createOrder(input: OrderInput): Promise<Order> {
  return apiPost<Order>("/orders", input);
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiPatch<Order>(`/orders/${id}/status`, { status });
}

export function addPayment(
  orderId: string,
  input: { amount: number; method: string; feePct?: number | null; note?: string | null }
): Promise<Payment> {
  return apiPost<Payment>(`/orders/${orderId}/payments`, input);
}

export function uploadAttachment(
  orderItemId: string,
  type: AttachmentType,
  file: File
): Promise<unknown> {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);
  return apiUpload(`/orders/items/${orderItemId}/attachments`, formData);
}

export function deleteAttachment(attachmentId: string): Promise<void> {
  return apiDelete<void>(`/orders/attachments/${attachmentId}`);
}
