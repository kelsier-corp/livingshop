import { OrderItem } from "./Order";
import { OrderStatus } from "./enums";

export interface OrderItemWithContext extends OrderItem {
  orderNumber: number;
  orderDate: Date;
  orderStatus: OrderStatus;
  customerFullName: string;
  // True when the item was edited after the order's factory sheet was last printed. False if it
  // was never printed — there's nothing to be stale relative to. Compares full timestamps, not
  // just the date, since an order can be printed and edited more than once in the same day.
  needsReprint: boolean;
}

export interface ProductionListQuery {
  page: number;
  pageSize: number;
  deliveryDate?: Date;
  number?: number;
}

export interface ProductionSheetQuery {
  deliveryDateFrom?: Date;
  deliveryDateTo?: Date;
}
