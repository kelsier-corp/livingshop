import { OrderItem } from "./Order";
import { OrderStatus } from "./enums";

export interface OrderItemWithContext extends OrderItem {
  orderNumber: number;
  orderDate: Date;
  orderStatus: OrderStatus;
  customerFullName: string;
}

export interface ProductionListQuery {
  page: number;
  pageSize: number;
}
