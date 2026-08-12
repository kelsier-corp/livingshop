import { ProductionStage } from "./types";

export const PRODUCTION_STAGES: ProductionStage[] = [
  "fabric",
  "frame",
  "foam",
  "base_cutting",
  "cushions_cutting",
  "base_upholstery",
  "cushions_upholstery",
  "ready",
];

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
