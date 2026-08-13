import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders } from "@/api/orders";
import { Order } from "@/api/types";
import { DataTable, DataTableColumn, DataTableSort } from "@/components/DataTable";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Card, FieldLabel, PageHeader, PrimaryButton, SecondaryButton, TextInput } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isNumericInput, respectsMinimum } from "@/utils/number";

const PAGE_SIZE = 10;

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function earliestDelivery(items: { deliveryDate: string }[]): string | null {
  if (items.length === 0) return null;
  return items.map((item) => item.deliveryDate).sort()[0];
}

const DEFAULT_SORT_BY = "date";
const DEFAULT_SORT_DIRECTION = "desc";

export function OrdersListPage() {
  const [page, setPage] = useState(1);
  const [numberFilter, setNumberFilter] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "number" | "deliveryDate">(DEFAULT_SORT_BY);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(DEFAULT_SORT_DIRECTION);
  const debouncedNumberFilter = useDebouncedValue(numberFilter);
  const debouncedCustomerQuery = useDebouncedValue(customerQuery);

  const { data, isLoading } = useQuery({
    queryKey: [
      "orders",
      { page, numberFilter: debouncedNumberFilter, customerQuery: debouncedCustomerQuery, dateFrom, dateTo, sortBy, sortDirection },
    ],
    queryFn: () =>
      fetchOrders({
        page,
        pageSize: PAGE_SIZE,
        number: debouncedNumberFilter ? Number(debouncedNumberFilter) : undefined,
        customerQuery: debouncedCustomerQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDirection,
      }),
  });

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function handleSortChange(key: string) {
    if (sortBy === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key as "date" | "number" | "deliveryDate");
      setSortDirection("asc");
    }
    setPage(1);
  }

  function handleClearFilters() {
    setNumberFilter("");
    setCustomerQuery("");
    setDateFrom("");
    setDateTo("");
    setSortBy(DEFAULT_SORT_BY);
    setSortDirection(DEFAULT_SORT_DIRECTION);
    setPage(1);
  }

  const sort: DataTableSort = { sortBy, direction: sortDirection, onChange: handleSortChange };
  const hasActiveFilters =
    numberFilter !== "" ||
    customerQuery !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sortBy !== DEFAULT_SORT_BY ||
    sortDirection !== DEFAULT_SORT_DIRECTION;

  const columns: DataTableColumn<Order>[] = [
    {
      key: "number",
      header: "N.º",
      width: "7%",
      sortKey: "number",
      render: (order) => <span className="font-mono font-medium text-ink">#{order.number}</span>,
    },
    { key: "date", header: "Fecha", width: "10%", render: (order) => formatDate(order.date) },
    {
      key: "customer",
      header: "Cliente",
      width: "16%",
      truncate: true,
      render: (order) => order.customerFullName,
    },
    {
      key: "delivery",
      header: "Entrega",
      width: "10%",
      sortKey: "deliveryDate",
      render: (order) => formatDate(earliestDelivery(order.items)),
    },
    {
      key: "products",
      width: "21%",
      header: "Productos",
      truncate: true,
      render: (order) => order.items.map((item) => item.productTypeName).join(", "),
    },
    {
      key: "total",
      header: "Total",
      width: "12%",
      align: "right",
      render: (order) => <span className="font-mono">{order.totals ? formatCurrency(order.totals.totalAmount) : "-"}</span>,
    },
    { key: "status", header: "Estado", width: "12%", render: (order) => <OrderStatusBadge status={order.status} /> },
    {
      key: "actions",
      header: "",
      width: "12%",
      align: "right",
      render: (order) => (
        <Link to={`/orders/${order.id}`} className="text-sm text-accent hover:underline">
          Ver
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Órdenes"
        actions={
          <Link to="/orders/new">
            <PrimaryButton>Nueva orden</PrimaryButton>
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <FieldLabel>Número</FieldLabel>
            <TextInput
              type="text"
              inputMode="numeric"
              placeholder="ej. 7901"
              value={numberFilter}
              onChange={(e) => {
                if (isNumericInput(e.target.value, { allowDecimal: false }) && respectsMinimum(e.target.value)) {
                  updateFilter(setNumberFilter, e.target.value);
                }
              }}
            />
          </div>
          <div>
            <FieldLabel>Cliente</FieldLabel>
            <TextInput
              placeholder="Nombre o apellido"
              value={customerQuery}
              onChange={(e) => updateFilter(setCustomerQuery, e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Desde</FieldLabel>
            <TextInput type="date" value={dateFrom} onChange={(e) => updateFilter(setDateFrom, e.target.value)} />
          </div>
          <div>
            <FieldLabel>Hasta</FieldLabel>
            <TextInput type="date" value={dateTo} onChange={(e) => updateFilter(setDateTo, e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <SecondaryButton type="button" disabled={!hasActiveFilters} onClick={handleClearFilters}>
            Limpiar filtros
          </SecondaryButton>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(order) => order.id}
            emptyMessage="No hay órdenes que coincidan con el filtro."
            sort={sort}
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
