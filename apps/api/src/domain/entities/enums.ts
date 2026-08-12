export const USER_ROLES = ["admin", "sales", "factory"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ATTRIBUTE_DATA_TYPES = ["text", "number", "catalog", "color"] as const;
export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number];

export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "in_production",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmada",
  in_production: "En producción",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

export const PRODUCTION_STAGES = [
  "fabric",
  "frame",
  "foam",
  "base_cutting",
  "cushions_cutting",
  "base_upholstery",
  "cushions_upholstery",
  "ready",
] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export const PRODUCTION_STAGE_LABEL: Record<ProductionStage, string> = {
  fabric: "Tela",
  frame: "Esqueleto",
  foam: "Espuma",
  base_cutting: "Corte (base)",
  cushions_cutting: "Corte (almohadones)",
  base_upholstery: "Tapizado (base)",
  cushions_upholstery: "Tapizado (almohadones)",
  ready: "Listo",
};

export const ATTACHMENT_TYPES = ["sketch", "reference_photo"] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];
