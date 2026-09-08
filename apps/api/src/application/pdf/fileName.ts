function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateTimeStamp(date: Date): string {
  return `${dateStamp(date)}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function orderSheetFileName(orderNumber: number, customerFullName: string): string {
  return `orden-${orderNumber}_${slugify(customerFullName)}_${dateStamp(new Date())}.pdf`;
}

export function factorySheetFileName(
  orderNumber: number,
  customerFullName: string,
  printedAt: Date | null
): string {
  return `ficha-tecnica_orden-${orderNumber}_${slugify(customerFullName)}_${dateTimeStamp(printedAt ?? new Date())}.pdf`;
}

export function productionSheetFileName(): string {
  return `planilla-produccion_${dateTimeStamp(new Date())}.pdf`;
}

export function salesSheetFileName(periodLabel: string): string {
  return `planilla-ventas_${slugify(periodLabel)}_${dateStamp(new Date())}.pdf`;
}

export function salesExportFileName(): string {
  return `planilla-ventas-semanal_${dateTimeStamp(new Date())}.xlsx`;
}
