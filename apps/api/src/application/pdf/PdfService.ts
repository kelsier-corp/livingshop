import { NotFoundError } from "@domain/errors/DomainError";
import { CustomerRepository } from "@domain/repositories/CustomerRepository";
import { OrderRepository } from "@domain/repositories/OrderRepository";
import {
  factorySheetFileName,
  orderSheetFileName,
  productionSheetFileName,
  salesSheetFileName,
} from "./fileName";
import { PdfRenderer } from "./PdfRenderer";

export interface GeneratedPdf {
  buffer: Buffer;
  fileName: string;
}

export class PdfService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly pdfRenderer: PdfRenderer
  ) {}

  async orderSheet(orderId: string): Promise<GeneratedPdf> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order", orderId);
    const customer = await this.customerRepository.findById(order.customerId);
    if (!customer) throw new NotFoundError("Customer", order.customerId);
    const buffer = await this.pdfRenderer.renderOrderSheet(order, customer);
    return { buffer, fileName: orderSheetFileName(order.number, order.customerFullName) };
  }

  async factorySheet(orderId: string): Promise<GeneratedPdf> {
    await this.orderRepository.markPrinted(orderId);
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order", orderId);
    const customer = await this.customerRepository.findById(order.customerId);
    if (!customer) throw new NotFoundError("Customer", order.customerId);
    const buffer = await this.pdfRenderer.renderFactorySheet(order, customer);
    return {
      buffer,
      fileName: factorySheetFileName(order.number, order.customerFullName, order.printedAt),
    };
  }

  async productionSheet(): Promise<GeneratedPdf> {
    const rows = await this.orderRepository.listAllItemsWithContext();
    const buffer = await this.pdfRenderer.renderProductionSheet(rows);
    return { buffer, fileName: productionSheetFileName() };
  }

  async salesSheet(periodLabel: string): Promise<GeneratedPdf> {
    const rows = await this.orderRepository.listAllSalesRows();
    const buffer = await this.pdfRenderer.renderSalesSheet(rows, periodLabel);
    return { buffer, fileName: salesSheetFileName(periodLabel) };
  }
}
