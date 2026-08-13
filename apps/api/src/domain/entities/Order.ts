import { AttachmentType, OrderStatus, ProductionStage } from "./enums";

export type AttributeValues = Record<string, string | number | boolean | null>;

export interface Attachment {
  id: string;
  orderItemId: string;
  type: AttachmentType;
  url: string;
  fileName: string;
}

export interface ProductionStageStatus {
  id: string;
  orderItemId: string;
  stage: ProductionStage;
  completed: boolean;
  completedAt: Date | null;
  userId: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productTypeId: string;
  productTypeName?: string;
  productTypeSketchUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate: Date;
  attributes: AttributeValues;
  factoryNotes: string | null;
  attachments: Attachment[];
  productionStages: ProductionStageStatus[];
}

export interface OrderItemInput {
  productTypeId: string;
  quantity: number;
  deliveryDate: Date;
  attributes: AttributeValues;
  factoryNotes?: string | null;
}

export interface Payment {
  id: string;
  orderId: string;
  date: Date;
  amount: number;
  method: string;
  feePct: number | null;
  note: string | null;
}

export interface PaymentInput {
  amount: number;
  method: string;
  feePct?: number | null;
  note?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

export interface Order {
  id: string;
  number: number;
  date: Date;
  printedAt: Date | null;
  customerId: string;
  customerFullName: string;
  salespersonId: string;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  payments: Payment[];
}

export interface OrderInput {
  customerId: string;
  salespersonId: string;
  notes?: string | null;
  items: OrderItemInput[];
}

export interface OrderItemCreateData extends OrderItemInput {
  unitPrice: number;
  totalPrice: number;
}

export interface OrderCreateData {
  customerId: string;
  salespersonId: string;
  notes?: string | null;
  items: OrderItemCreateData[];
}

export interface OrderListQuery {
  page: number;
  pageSize: number;
  number?: number;
  customerQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "date" | "number" | "deliveryDate";
  sortDirection?: "asc" | "desc";
}
