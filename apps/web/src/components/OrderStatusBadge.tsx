import { OrderStatus } from "@/api/types";
import { Badge } from "./ui";

const TONE: Record<OrderStatus, "slate" | "green" | "amber" | "red"> = {
  draft: "slate",
  confirmed: "amber",
  in_production: "amber",
  delivered: "green",
  cancelled: "red",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmada",
  in_production: "En producción",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
