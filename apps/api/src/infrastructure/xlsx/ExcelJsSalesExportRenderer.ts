import ExcelJS from "exceljs";
import { DateTime } from "luxon";
import { SalesExportRenderer } from "@application/sales/SalesExportRenderer";
import { SalesRow } from "@domain/entities/Sales";

const COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "Periodo", key: "period", width: 22 },
  { header: "Orden", key: "orderNumber", width: 10 },
  { header: "Productos", key: "products", width: 36 },
  { header: "Proveedor", key: "supplier", width: 16 },
  { header: "Pedido", key: "supplierOrder", width: 12 },
  { header: "Forma de pago", key: "paymentMethod", width: 16 },
  { header: "Importe", key: "amount", width: 14 },
  { header: "Entrega", key: "deliveryDate", width: 14 },
  { header: "Saldo a", key: "balance", width: 14 },
  { header: "Comentarios", key: "comments", width: 20 },
  { header: "Tasas", key: "fees", width: 12 },
  { header: "Importe de acreditación", key: "creditedAmount", width: 20 },
  { header: "Fecha de acreditación", key: "creditedDate", width: 18 },
  { header: "Tipo de", key: "invoiceType", width: 16 },
  { header: "Datos de facturación", key: "billingInfo", width: 28 },
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

    // The order's balance is a per-order figure, not a per-item one — show it only on an order's
    // first row so a plain SUM() over the column in the destination spreadsheet doesn't multiply
    // it by the order's item count.
    const seenOrders = new Set<number>();
    for (const flat of flattenByWeek(rows)) {
      const isFirstRowForOrder = !seenOrders.has(flat.orderNumber);
      seenOrders.add(flat.orderNumber);

      const row = sheet.addRow({
        period: flat.periodLabel,
        orderNumber: flat.orderNumber,
        products: flat.productLabel,
        amount: flat.amount,
        deliveryDate: flat.deliveryDate,
        balance: isFirstRowForOrder ? flat.balance : "",
        invoiceType: flat.invoiceType ?? "",
        billingInfo: flat.billingInfo ?? "",
      });
      row.getCell("amount").numFmt = "#,##0.00";
      row.getCell("balance").numFmt = "#,##0.00";
      row.getCell("deliveryDate").numFmt = "dd/mm/yyyy";
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
      // `deliveryDate` comes from a date-only input coerced via `z.coerce.date()`, so JS always
      // parses it as midnight UTC. Grouping with the runtime's local zone instead of "utc" would
      // shift dates near a week boundary into the wrong ISO week whenever the server doesn't run
      // in UTC (e.g. Argentina, UTC-3).
      const weekStart = DateTime.fromJSDate(item.deliveryDate, { zone: "utc" }).startOf("week");
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
