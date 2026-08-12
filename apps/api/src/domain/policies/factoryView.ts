import { Order, OrderItem } from "../entities/Order";

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
