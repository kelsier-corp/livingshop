import { Customer } from "@domain/entities/Customer";
import { Order } from "@domain/entities/Order";
import { OrderItemWithContext } from "@domain/entities/Production";
import { SalesRow } from "@domain/entities/Sales";

export interface PdfRenderer {
  renderOrderSheet(order: Order, customer: Customer): Promise<Buffer>;
  renderFactorySheet(order: Order, customer: Customer): Promise<Buffer>;
  renderProductionSheet(rows: OrderItemWithContext[]): Promise<Buffer>;
  renderSalesSheet(rows: SalesRow[], periodLabel: string): Promise<Buffer>;
}
