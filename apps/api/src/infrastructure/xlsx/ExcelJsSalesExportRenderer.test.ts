import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { SalesRow } from "@domain/entities/Sales";
import { ExcelJsSalesExportRenderer } from "./ExcelJsSalesExportRenderer";

function buildRow(overrides: Partial<SalesRow> = {}): SalesRow {
  return {
    orderId: "order-1",
    orderNumber: 1,
    orderDate: new Date("2026-09-01"),
    customerFullName: "Ana Test",
    customerTaxId: null,
    customerBusinessName: null,
    customerInvoiceType: null,
    items: [
      {
        productTypeName: "Sofá Chester",
        quantity: 1,
        totalPrice: 1000,
        deliveryDate: new Date("2026-09-02"),
      },
    ],
    totalAmount: 1000,
    amountPaid: 400,
    balance: 600,
    status: "draft",
    ...overrides,
  };
}

async function readSheet(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet("Ventas");
  if (!sheet) throw new Error("Sheet 'Ventas' not found");
  return sheet;
}

// exceljs's column `key` (used to write via addRow({ productos: ... })) isn't part of the xlsx
// file format, so it doesn't survive a save/reload round trip — cells have to be read back by
// their header text instead.
function cellByHeader(sheet: ExcelJS.Worksheet, rowNumber: number, header: string) {
  const headerRow = sheet.getRow(1);
  let columnIndex = -1;
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value === header) columnIndex = colNumber;
  });
  if (columnIndex === -1) throw new Error(`Column "${header}" not found`);
  return sheet.getRow(rowNumber).getCell(columnIndex);
}

describe("ExcelJsSalesExportRenderer", () => {
  it("writes the header row with every column from the ticket", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    const sheet = await readSheet(await renderer.renderWeeklySheet([buildRow()]));

    expect(sheet.getRow(1).values).toEqual([
      undefined,
      "Periodo",
      "Orden",
      "Productos",
      "Proveedor",
      "Pedido",
      "Forma de pago",
      "Importe",
      "Entrega",
      "Saldo a",
      "Comentarios",
      "Tasas",
      "Importe de acreditación",
      "Fecha de acreditación",
      "Tipo de",
      "Datos de facturación",
    ]);
  });

  it("emits one row per product line, leaving the manual-fill columns blank", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    const row = buildRow({
      items: [
        { productTypeName: "Sofá Chester", quantity: 1, totalPrice: 1000, deliveryDate: new Date("2026-09-02") },
        { productTypeName: "Puff", quantity: 2, totalPrice: 200, deliveryDate: new Date("2026-09-03") },
      ],
    });
    const sheet = await readSheet(await renderer.renderWeeklySheet([row]));

    expect(sheet.rowCount).toBe(3);
    expect(cellByHeader(sheet, 2, "Productos").value).toBe("1x Sofá Chester");
    expect(cellByHeader(sheet, 3, "Productos").value).toBe("2x Puff");
    for (const header of [
      "Proveedor",
      "Pedido",
      "Forma de pago",
      "Comentarios",
      "Tasas",
      "Importe de acreditación",
      "Fecha de acreditación",
    ]) {
      expect(cellByHeader(sheet, 2, header).value).toBeFalsy();
    }
  });

  it("sorts rows by the Monday-Sunday week of each item's own delivery date", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    const rows = [
      buildRow({
        orderNumber: 1,
        items: [
          { productTypeName: "Late delivery", quantity: 1, totalPrice: 100, deliveryDate: new Date("2026-09-10") },
        ],
      }),
      buildRow({
        orderNumber: 2,
        items: [
          { productTypeName: "Early delivery", quantity: 1, totalPrice: 100, deliveryDate: new Date("2026-09-01") },
        ],
      }),
    ];
    const sheet = await readSheet(await renderer.renderWeeklySheet(rows));

    expect(cellByHeader(sheet, 2, "Productos").value).toBe("1x Early delivery");
    expect(cellByHeader(sheet, 3, "Productos").value).toBe("1x Late delivery");
    expect(cellByHeader(sheet, 2, "Periodo").value).toBe("31/08/2026 - 06/09/2026");
    expect(cellByHeader(sheet, 3, "Periodo").value).toBe("07/09/2026 - 13/09/2026");
  });

  it("shows the order balance only on its first row, blank on the rest", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    const row = buildRow({
      balance: 600,
      items: [
        { productTypeName: "Sofá Chester", quantity: 1, totalPrice: 1000, deliveryDate: new Date("2026-09-02") },
        { productTypeName: "Puff", quantity: 2, totalPrice: 200, deliveryDate: new Date("2026-09-03") },
      ],
    });
    const sheet = await readSheet(await renderer.renderWeeklySheet([row]));

    expect(cellByHeader(sheet, 2, "Saldo a").value).toBe(600);
    expect(cellByHeader(sheet, 3, "Saldo a").value).toBeFalsy();
  });

  it("keeps a delivery date at the start of an ISO week in that week regardless of the runtime's local timezone", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    // Monday 2026-09-07T00:00:00Z: a naive local-zone conversion in a negative-offset timezone
    // (e.g. America/Argentina/Buenos_Aires, UTC-3) would roll this back into the prior Sunday,
    // and thus the prior ISO week.
    const row = buildRow({
      items: [
        {
          productTypeName: "Sofá Chester",
          quantity: 1,
          totalPrice: 1000,
          deliveryDate: new Date("2026-09-07T00:00:00.000Z"),
        },
      ],
    });
    const sheet = await readSheet(await renderer.renderWeeklySheet([row]));

    expect(cellByHeader(sheet, 2, "Periodo").value).toBe("07/09/2026 - 13/09/2026");
  });

  it("serializes billing info from the customer's tax id and business name, falling back to their full name", async () => {
    const renderer = new ExcelJsSalesExportRenderer();
    const rows = [
      buildRow({
        orderNumber: 1,
        customerFullName: "Ana Test",
        customerTaxId: "20-12345678-9",
        customerBusinessName: "Ana Test SRL",
        customerInvoiceType: "A",
      }),
      buildRow({
        orderNumber: 2,
        customerFullName: "Beto Sinfactura",
        customerTaxId: null,
        customerBusinessName: null,
        customerInvoiceType: null,
        items: [
          { productTypeName: "Almohadón", quantity: 1, totalPrice: 100, deliveryDate: new Date("2026-09-02") },
        ],
      }),
    ];
    const sheet = await readSheet(await renderer.renderWeeklySheet(rows));

    expect(cellByHeader(sheet, 2, "Datos de facturación").value).toBe(
      "20-12345678-9 - Ana Test SRL"
    );
    expect(cellByHeader(sheet, 2, "Tipo de").value).toBe("A");
    expect(cellByHeader(sheet, 3, "Datos de facturación").value).toBe("Beto Sinfactura");
    expect(cellByHeader(sheet, 3, "Tipo de").value).toBeFalsy();
  });
});
