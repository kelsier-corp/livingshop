export type UserRole = "admin" | "sales" | "factory";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  deliveryAddress: string | null;
  mobilePhone: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export type AttributeDataType = "text" | "number" | "catalog" | "color";

export interface AttributeDefinition {
  id: string;
  productTypeId: string;
  name: string;
  dataType: AttributeDataType;
  attributeCatalogId: string | null;
  sortOrder: number;
  required: boolean;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface ProductCategory extends ProductCategoryRef {
  productCount: number;
}

export interface ProductType {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  active: boolean;
  sketchUrl: string | null;
  sketchFileName: string | null;
  includeInFactorySheet: boolean;
  categories: ProductCategoryRef[];
  attributeDefinitions: AttributeDefinition[];
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AttributeCatalogValue {
  id: string;
  attributeCatalogId: string;
  value: string;
  active: boolean;
}

export interface AttributeCatalog {
  id: string;
  name: string;
  values: AttributeCatalogValue[];
}

export type OrderStatus = "draft" | "confirmed" | "in_production" | "delivered" | "cancelled";

export type AttachmentType = "sketch" | "reference_photo";

export interface Attachment {
  id: string;
  orderItemId: string;
  type: AttachmentType;
  url: string;
  fileName: string;
}

export type ProductionStage =
  | "fabric"
  | "frame"
  | "foam"
  | "base_cutting"
  | "cushions_cutting"
  | "base_upholstery"
  | "cushions_upholstery"
  | "ready";

export interface ProductionStageStatus {
  id: string;
  orderItemId: string;
  stage: ProductionStage;
  completed: boolean;
  completedAt: string | null;
  userId: string | null;
}

export type AttributeValues = Record<string, string | number | boolean | null>;

export interface OrderItem {
  id: string;
  orderId: string;
  productTypeId: string;
  productTypeName?: string;
  productTypeSketchUrl?: string | null;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  deliveryDate: string;
  attributes: AttributeValues;
  factoryNotes: string | null;
  attachments: Attachment[];
  productionStages: ProductionStageStatus[];
}

export interface Payment {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  method: string;
  feePct: number | null;
  note: string | null;
}

export interface OrderTotals {
  totalAmount: number;
  amountPaid: number;
  balance: number;
}

export interface Order {
  id: string;
  number: number;
  date: string;
  printedAt: string | null;
  customerId: string;
  customerFullName: string;
  salespersonId: string;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  payments?: Payment[];
  totals?: OrderTotals;
}

export interface OrderItemWithContext extends OrderItem {
  orderNumber: number;
  orderDate: string;
  orderStatus: OrderStatus;
  customerFullName: string;
}

export interface SalesRowItem {
  productTypeName: string;
  quantity: number;
  totalPrice: number;
  deliveryDate: string;
}

export interface SalesRow {
  orderId: string;
  orderNumber: number;
  orderDate: string;
  customerFullName: string;
  items: SalesRowItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: OrderStatus;
}
