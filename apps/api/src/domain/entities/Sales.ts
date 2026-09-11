import { OrderStatus } from "./enums";

export interface SalesRowItem {
  productTypeName: string;
  quantity: number;
  totalPrice: number;
  deliveryDate: Date;
}

export interface SalesRow {
  orderId: string;
  orderNumber: number;
  orderDate: Date;
  customerFullName: string;
  customerTaxId: string | null;
  customerBusinessName: string | null;
  customerInvoiceType: string | null;
  items: SalesRowItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: OrderStatus;
}

export interface SalesListQuery {
  page: number;
  pageSize: number;
  customerQuery?: string;
  orderNumber?: number;
}
