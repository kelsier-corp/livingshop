import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PRODUCTION_STAGE_LABEL, PRODUCTION_STAGES } from "@/api/constants";
import { pdfUrl } from "@/api/client";
import { updateOrderStatus } from "@/api/orders";
import { fetchProductionBoard, toggleProductionStage } from "@/api/production";
import { OrderItemWithContext, OrderStatus, ProductionStage } from "@/api/types";
import { ORDER_STATUS_LABEL } from "@/components/OrderStatusBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Card, FieldLabel, PageHeader, Select, SecondaryButton, TextInput } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isNumericInput, respectsMinimum } from "@/utils/number";

const PAGE_SIZE = 15;
const FACTORY_STATUSES: OrderStatus[] = ["confirmed", "in_production"];

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-AR");
}

export function ProductionPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
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

  const toggleMutation = useMutation({
    mutationFn: ({
      orderItemId,
      stage,
      completed,
    }: {
      orderItemId: string;
      stage: ProductionStage;
      completed: boolean;
    }) => toggleProductionStage(orderItemId, stage, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-board"] }),
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
      width: "8%",
      render: (row) => formatDate(row.deliveryDate),
    },
    {
      key: "order",
      header: "Orden",
      width: "6%",
      render: (row) => <span className="font-mono text-ink-soft">#{row.orderNumber}</span>,
    },
    {
      key: "product",
      header: "Producto",
      width: "15%",
      truncate: true,
      render: (row) => <span className="font-medium text-ink">{row.productTypeName}</span>,
    },
    { key: "qty", header: "Cant.", width: "5%", render: (row) => row.quantity },
    {
      key: "status",
      header: "Estado",
      width: "10%",
      render: (row) => (
        <Select
          value={row.orderStatus}
          onChange={(e) =>
            statusMutation.mutate({ orderId: row.orderId, status: e.target.value as OrderStatus })
          }
          className="text-xs"
        >
          {FACTORY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>
      ),
    },
    ...PRODUCTION_STAGES.map<DataTableColumn<OrderItemWithContext>>((stage) => ({
      key: stage,
      header: PRODUCTION_STAGE_LABEL[stage],
      width: `${56 / PRODUCTION_STAGES.length}%`,
      align: "center",
      render: (row) => {
        const status = row.productionStages.find((s) => s.stage === stage);
        return (
          <input
            type="checkbox"
            checked={status?.completed ?? false}
            onChange={(e) =>
              toggleMutation.mutate({ orderItemId: row.id, stage, completed: e.target.checked })
            }
          />
        );
      },
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Producción"
        actions={
          <a href={pdfUrl("/pdf/production/sheet.pdf")} target="_blank" rel="noreferrer">
            <SecondaryButton type="button">Imprimir planilla</SecondaryButton>
          </a>
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
    </div>
  );
}
