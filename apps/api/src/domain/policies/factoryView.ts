import { OrderItemWithContext } from "../entities/Production";

// Factory can now see an order's full detail (including pricing and payments) via /orders —
// they just can't edit any of it. The production board is the only surface left that still
// hides pricing from factory (see toFactoryProductionItemView below).

export type FactoryProductionItemView = Omit<OrderItemWithContext, "unitPrice" | "totalPrice">;

export function toFactoryProductionItemView(item: OrderItemWithContext): FactoryProductionItemView {
  const { unitPrice, totalPrice, ...rest } = item;
  return rest;
}
