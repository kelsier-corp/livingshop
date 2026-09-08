import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { pdfUrl, toQueryString } from "@/api/client";
import { updateOrderStatus } from "@/api/orders";
import { fetchProductionBoard } from "@/api/production";
import { OrderItemWithContext, OrderStatus } from "@/api/types";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/components/OrderStatusBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import {
  Card,
  FieldLabel,
  PageHeader,
  PrimaryButton,
  Select,
  SecondaryButton,
  TextInput,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isNumericInput, respectsMinimum } from "@/utils/number";

const PAGE_SIZE = 15;

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-AR");
}

export function ProductionPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printDateFrom, setPrintDateFrom] = useState("");
  const [printDateTo, setPrintDateTo] = useState("");
  const debouncedNumberFilter = useDebouncedValue(numberFilter);
  const { data, isLoading } = useQuery({
    queryKey: ["production-board", page, deliveryDateFilter, debouncedNumberFilter],
    queryFn: () =>
      fetchProductionBoard({
        page,
        pageSize: PAGE_SIZE,
        deliveryDate: deliveryDateFilter || undefined,
        number: debouncedNumberFilter ? Number(debouncedNumberFilter) : undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-board"] }),
  });

  const columns: DataTableColumn<OrderItemWithContext>[] = [
    {
      key: "delivery",
      header: "Entrega",
      width: "10%",
      render: (row) => formatDate(row.deliveryDate),
    },
    {
      key: "order",
      header: "Orden",
      width: "8%",
      render: (row) => <span className="font-mono text-ink-soft">#{row.orderNumber}</span>,
    },
    {
      key: "product",
      header: "Producto",
      width: "30%",
      truncate: true,
      render: (row) => (
        <span className="font-medium text-ink">
          {row.productTypeName}
          {row.needsReprint && (
            <span
              className="ml-2 rounded-sm bg-signal/10 px-1.5 py-0.5 text-[10px] font-medium text-signal"
              title="Se editó después de la última impresión de la ficha técnica"
            >
              editado
            </span>
          )}
        </span>
      ),
    },
    { key: "qty", header: "Cant.", width: "6%", render: (row) => row.quantity },
    {
      key: "status",
      header: "Estado",
      width: "16%",
      render: (row) => (
        <Select
          value={row.orderStatus}
          onChange={(e) =>
            statusMutation.mutate({ orderId: row.orderId, status: e.target.value as OrderStatus })
          }
        >
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "30%",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.needsReprint && (
            <span
              className="text-base text-signal"
              title="Se editó después de la última impresión — conviene reimprimir"
            >
              ⚠
            </span>
          )}
          <a
            href={pdfUrl(`/pdf/orders/${row.orderId}/factory-sheet.pdf`)}
            target="_blank"
            rel="noreferrer"
          >
            <SecondaryButton type="button">Ficha técnica</SecondaryButton>
          </a>
        </div>
      ),
    },
  ];

  function handlePrintSubmit(e: FormEvent) {
    e.preventDefault();
    const query = toQueryString({
      deliveryDateFrom: printDateFrom || undefined,
      deliveryDateTo: printDateTo || undefined,
    });
    window.open(pdfUrl(`/pdf/production/sheet.pdf${query}`), "_blank", "noopener,noreferrer");
    setPrintModalOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Producción"
        actions={
          <SecondaryButton type="button" onClick={() => setPrintModalOpen(true)}>
            Imprimir planilla
          </SecondaryButton>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <FieldLabel>Fecha de entrega</FieldLabel>
            <TextInput
              type="date"
              value={deliveryDateFilter}
              onChange={(e) => {
                setDeliveryDateFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <FieldLabel>Número de orden</FieldLabel>
            <TextInput
              type="text"
              inputMode="numeric"
              placeholder="ej. 7901"
              value={numberFilter}
              onChange={(e) => {
                if (
                  isNumericInput(e.target.value, { allowDecimal: false }) &&
                  respectsMinimum(e.target.value)
                ) {
                  setNumberFilter(e.target.value);
                  setPage(1);
                }
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
            rowKey={(row) => row.id}
            emptyMessage="Todavía no hay productos en producción."
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

      <Modal
        open={printModalOpen}
        title="Imprimir planilla de producción"
        onClose={() => setPrintModalOpen(false)}
      >
        <form onSubmit={handlePrintSubmit}>
          <p className="mb-4 text-sm text-ink-soft">
            Elegí el rango de fechas de entrega a incluir en la planilla.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Desde</FieldLabel>
              <TextInput
                type="date"
                value={printDateFrom}
                onChange={(e) => setPrintDateFrom(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Hasta</FieldLabel>
              <TextInput
                type="date"
                value={printDateTo}
                onChange={(e) => setPrintDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setPrintModalOpen(false)}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit">Generar PDF</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
