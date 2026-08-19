import { promises as fs } from "fs";
import path from "path";
import React from "react";
import { PdfRenderer } from "@application/pdf/PdfRenderer";
import { Customer } from "@domain/entities/Customer";
import { Order } from "@domain/entities/Order";
import { OrderItemWithContext } from "@domain/entities/Production";
import { SalesRow } from "@domain/entities/Sales";
import { renderToBuffer } from "./renderToBuffer";
import { FactorySheetDocument } from "./templates/FactorySheetDocument";
import { OrderSheetDocument } from "./templates/OrderSheetDocument";
import { ProductionSheetDocument } from "./templates/ProductionSheetDocument";
import { SalesSheetDocument } from "./templates/SalesSheetDocument";

export class ReactPdfRenderer implements PdfRenderer {
  constructor(private readonly uploadsDir: string) {}

  async renderOrderSheet(order: Order, customer: Customer): Promise<Buffer> {
    return renderToBuffer(<OrderSheetDocument order={order} customer={customer} />);
  }

  async renderFactorySheet(order: Order, customer: Customer): Promise<Buffer> {
    const sketches = await this.resolveSketches(order);
    const referencePhotos = await this.resolveReferencePhotos(order);
    return renderToBuffer(
      <FactorySheetDocument
        order={order}
        customer={customer}
        sketches={sketches}
        referencePhotos={referencePhotos}
      />
    );
  }

  async renderProductionSheet(rows: OrderItemWithContext[]): Promise<Buffer> {
    return renderToBuffer(<ProductionSheetDocument rows={rows} />);
  }

  async renderSalesSheet(rows: SalesRow[], periodLabel: string): Promise<Buffer> {
    return renderToBuffer(<SalesSheetDocument rows={rows} periodLabel={periodLabel} />);
  }

  private async resolveSketches(order: Order) {
    const sketches: Record<string, { data: Buffer; format: "png" | "jpg" }> = {};

    for (const item of order.items) {
      if (!item.productTypeSketchUrl || sketches[item.productTypeId]) continue;
      try {
        const filePath = path.join(this.uploadsDir, path.basename(item.productTypeSketchUrl));
        const data = await fs.readFile(filePath);
        const extension = path.extname(filePath).toLowerCase();
        const format = extension === ".png" ? "png" : "jpg";
        sketches[item.productTypeId] = { data, format };
      } catch {
        continue;
      }
    }

    return sketches;
  }

  private async resolveReferencePhotos(order: Order) {
    const photos: Record<string, { data: Buffer; format: "png" | "jpg" }[]> = {};

    for (const item of order.items) {
      for (const attachment of item.attachments) {
        if (attachment.type !== "reference_photo") continue;
        try {
          const filePath = path.join(this.uploadsDir, path.basename(attachment.url));
          const data = await fs.readFile(filePath);
          const extension = path.extname(filePath).toLowerCase();
          const format = extension === ".png" ? "png" : "jpg";
          (photos[item.id] ??= []).push({ data, format });
        } catch {
          continue;
        }
      }
    }

    return photos;
  }
}
