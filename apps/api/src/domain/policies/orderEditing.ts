import { OrderStatus } from "../entities/enums";

// Products can only be added to or taken off an order while it's still being agreed with the
// customer. Once the factory has started building it (in_production) the item list is what the
// floor is working from, and delivered/cancelled orders are closed records.
export const ITEM_EDITABLE_STATUSES: readonly OrderStatus[] = ["draft", "confirmed"];

export function canEditItems(status: OrderStatus): boolean {
  return ITEM_EDITABLE_STATUSES.includes(status);
}

// Payments are deliberately NOT gated by status: a customer can pay off the balance (or a
// mistyped amount can surface) long after the order was delivered, so the payment list stays
// editable for the whole life of the order.
