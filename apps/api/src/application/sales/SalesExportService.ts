import { salesExportFileName } from "@application/pdf/fileName";
import { SalesExportRenderer } from "@application/sales/SalesExportRenderer";
import { OrderRepository } from "@domain/repositories/OrderRepository";

export interface GeneratedFile {
  buffer: Buffer;
  fileName: string;
}

export class SalesExportService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly salesExportRenderer: SalesExportRenderer
  ) {}

  async weeklySheet(): Promise<GeneratedFile> {
    const rows = await this.orderRepository.listAllSalesRows();
    const buffer = await this.salesExportRenderer.renderWeeklySheet(rows);
    return { buffer, fileName: salesExportFileName() };
  }
}
