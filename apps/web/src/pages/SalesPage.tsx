import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { fileUrl, pdfUrl } from "@/api/client";
import { fetchSalesRows } from "@/api/sales";
import { SalesRow } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Card, FieldLabel, PageHeader, SecondaryButton, TextInput } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency } from "@/utils/currency";

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR");
}

export function SalesPage() {
  const [page, setPage] = useState(1);
  const [customerQuery, setCustomerQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const debouncedCustomerQuery = useDebouncedValue(customerQuery);
  const debouncedOrderQuery = useDebouncedValue(orderQuery);
  const orderNumber = /^\d+$/.test(debouncedOrderQuery.trim())
    ? Number(debouncedOrderQuery.trim())
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["sales", { page, customerQuery: debouncedCustomerQuery, orderNumber }],
    queryFn: () =>
      fetchSalesRows({
        page,
        pageSize: PAGE_SIZE,
        customerQuery: debouncedCustomerQuery || undefined,
        orderNumber,
      }),
  });

  const columns: DataTableColumn<SalesRow>[] = [
    {
      key: "number",
      header: "Orden",
      width: "8%",
      render: (row) => (
        <Link
          to={`/orders/${row.orderId}`}
          className="font-mono font-medium text-accent hover:underline"
        >
          #{row.orderNumber}
        </Link>
      ),
    },
    { key: "date", header: "Fecha", width: "12%", render: (row) => formatDate(row.orderDate) },
    {
      key: "customer",
      header: "Cliente",
      width: "26%",
      truncate: true,
      render: (row) => row.customerFullName,
    },
    {
      key: "total",
      header: "Total",
      width: "16%",
      align: "right",
      render: (row) => <span className="font-mono">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: "paid",
      header: "Pagado",
      width: "14%",
      align: "right",
      render: (row) => <span className="font-mono">{formatCurrency(row.amountPaid)}</span>,
    },
    {
      key: "balance",
      header: "Saldo",
      width: "12%",
      align: "right",
      render: (row) => <span className="font-mono">{formatCurrency(row.balance)}</span>,
    },
    {
      key: "status",
      header: "Estado",
      width: "12%",
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ventas"
        actions={
          <div className="flex gap-2">
            <a href={fileUrl("/sales/sheet.xlsx")} target="_blank" rel="noreferrer">
              <SecondaryButton type="button">Generar planilla</SecondaryButton>
            </a>
            <a href={pdfUrl("/pdf/sales/sheet.pdf")} target="_blank" rel="noreferrer">
              <SecondaryButton type="button">Imprimir planilla</SecondaryButton>
            </a>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Cliente</FieldLabel>
            <TextInput
              placeholder="Nombre o apellido…"
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <FieldLabel>Orden</FieldLabel>
            <TextInput
              placeholder="Número exacto, ej. 7901"
              value={orderQuery}
              onChange={(e) => {
                setOrderQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.orderId}
            emptyMessage="No hay ventas que coincidan con la búsqueda."
            pagination={{
              mode: "server",
              page,
              pageSize: PAGE_SIZE,
              total: data?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        )}
      </Card>
    </div>
  );
}
