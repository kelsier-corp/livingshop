import { Order, OrderItem } from "../entities/Order";
import { OrderItemWithContext } from "../entities/Production";

export type FactoryOrderItemView = Omit<OrderItem, "unitPrice" | "totalPrice">;
export type FactoryOrderView = Omit<Order, "items" | "payments"> & {
  items: FactoryOrderItemView[];
};

export function toFactoryOrderView(order: Order): FactoryOrderView {
  const { payments, items, ...rest } = order;
  return {
    ...rest,
    items: items.map(({ unitPrice, totalPrice, ...item }) => item),
  };
}

export type FactoryProductionItemView = Omit<OrderItemWithContext, "unitPrice" | "totalPrice">;

export function toFactoryProductionItemView(item: OrderItemWithContext): FactoryProductionItemView {
  const { unitPrice, totalPrice, ...rest } = item;
  return rest;
}
