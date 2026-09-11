import { SalesRow } from "@domain/entities/Sales";

export interface SalesExportRenderer {
  renderWeeklySheet(rows: SalesRow[]): Promise<Buffer>;
}
