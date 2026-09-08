import ExcelJS from "exceljs";
import { DateTime } from "luxon";
import { SalesExportRenderer } from "@application/sales/SalesExportRenderer";
import { SalesRow } from "@domain/entities/Sales";

const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "Periodo", key: "periodo", width: 22 },
  { header: "Orden", key: "orden", width: 10 },
  { header: "Productos", key: "productos", width: 36 },
  { header: "Proveedor", key: "proveedor", width: 16 },
  { header: "Pedido", key: "pedido", width: 12 },
  { header: "Forma de pago", key: "formaDePago", width: 16 },
  { header: "Importe", key: "importe", width: 14 },
  { header: "Entrega", key: "entrega", width: 14 },
  { header: "Saldo a", key: "saldoA", width: 14 },
  { header: "Comentarios", key: "comentarios", width: 20 },
  { header: "Tasas", key: "tasas", width: 12 },
  { header: "Importe de acreditación", key: "importeAcreditacion", width: 20 },
  { header: "Fecha de acreditación", key: "fechaAcreditacion", width: 18 },
  { header: "Tipo de", key: "tipoDe", width: 16 },
  { header: "Datos de facturación", key: "datosFacturacion", width: 28 },
];

interface FlatSalesRow {
  weekStart: DateTime;
  periodLabel: string;
  orderNumber: number;
  productLabel: string;
  amount: number;
  deliveryDate: Date;
  balance: number;
  invoiceType: string | null;
  billingInfo: string | null;
}

export class ExcelJsSalesExportRenderer implements SalesExportRenderer {
  async renderWeeklySheet(rows: SalesRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Ventas");
    sheet.columns = COLUMNS;
    sheet.getRow(1).font = { bold: true };

    for (const flat of flattenByWeek(rows)) {
      const row = sheet.addRow({
        periodo: flat.periodLabel,
        orden: flat.orderNumber,
        productos: flat.productLabel,
        importe: flat.amount,
        entrega: flat.deliveryDate,
        saldoA: flat.balance,
        tipoDe: flat.invoiceType ?? "",
        datosFacturacion: flat.billingInfo ?? "",
      });
      row.getCell("importe").numFmt = "#,##0.00";
      row.getCell("saldoA").numFmt = "#,##0.00";
      row.getCell("entrega").numFmt = "dd/mm/yyyy";
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

// Sorted by the Monday-Sunday week of each item's own delivery date (not the order's), since a
// single order can span multiple product lines with different deliveries — see issue #15.
function flattenByWeek(rows: SalesRow[]): FlatSalesRow[] {
  const flat = rows.flatMap((row) =>
    row.items.map((item) => {
      const weekStart = DateTime.fromJSDate(item.deliveryDate).startOf("week");
      const weekEnd = weekStart.endOf("week");
      return {
        weekStart,
        periodLabel: `${weekStart.toFormat("dd/MM/yyyy")} - ${weekEnd.toFormat("dd/MM/yyyy")}`,
        orderNumber: row.orderNumber,
        productLabel: `${item.quantity}x ${item.productTypeName}`,
        amount: item.totalPrice,
        deliveryDate: item.deliveryDate,
        balance: row.balance,
        invoiceType: row.customerInvoiceType,
        billingInfo: formatBillingInfo(row),
      };
    })
  );

  return flat.sort((a, b) => {
    const weekDiff = a.weekStart.toMillis() - b.weekStart.toMillis();
    if (weekDiff !== 0) return weekDiff;
    const deliveryDiff = a.deliveryDate.getTime() - b.deliveryDate.getTime();
    if (deliveryDiff !== 0) return deliveryDiff;
    return a.orderNumber - b.orderNumber;
  });
}

// "CUIT/CUIL/DNI + razón social/nombre del cliente" per issue #16 — falls back to the customer's
// full name when there's no razón social on file, and drops the tax id segment when absent so an
// order for a customer with no billing data yet doesn't render "- Full Name".
function formatBillingInfo(row: SalesRow): string | null {
  const name = row.customerBusinessName || row.customerFullName;
  if (!row.customerTaxId) return name || null;
  return `${row.customerTaxId} - ${name}`;
}
