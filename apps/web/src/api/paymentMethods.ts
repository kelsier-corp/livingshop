import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { PaymentMethod } from "./types";

export function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return apiGet<PaymentMethod[]>("/payment-methods");
}

export function createPaymentMethod(name: string): Promise<PaymentMethod> {
  return apiPost<PaymentMethod>("/payment-methods", { name });
}

export function updatePaymentMethod(id: string, name: string, active: boolean): Promise<PaymentMethod> {
  return apiPut<PaymentMethod>(`/payment-methods/${id}`, { name, active });
}

export function deletePaymentMethod(id: string): Promise<void> {
  return apiDelete<void>(`/payment-methods/${id}`);
}
