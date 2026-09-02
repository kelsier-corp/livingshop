import { OrderStatus } from "@/api/types";
import { Badge } from "./ui";

const TONE: Record<OrderStatus, "slate" | "green" | "amber" | "red"> = {
  draft: "slate",
  in_production: "amber",
  delivered: "green",
  voided: "red",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Borrador",
  in_production: "Producción",
  delivered: "Entregada",
  voided: "Anulada",
};

// Single source of truth for "every status a user can pick" — admin, sales and factory can all
// set an order to any of these, so any status <select> in the app should be built from this list
// instead of hardcoding its own copy.
export const ORDER_STATUSES: OrderStatus[] = ["draft", "in_production", "delivered", "voided"];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
