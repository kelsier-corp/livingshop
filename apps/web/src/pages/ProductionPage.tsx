import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PRODUCTION_STAGE_LABEL, PRODUCTION_STAGES } from "@/api/constants";
import { pdfUrl } from "@/api/client";
import { fetchProductionBoard, toggleProductionStage } from "@/api/production";
import { OrderItemWithContext, ProductionStage } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Card, PageHeader, SecondaryButton } from "@/components/ui";

const PAGE_SIZE = 15;

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-AR");
}

export function ProductionPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["production-board", page],
    queryFn: () => fetchProductionBoard({ page, pageSize: PAGE_SIZE }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ orderItemId, stage, completed }: { orderItemId: string; stage: ProductionStage; completed: boolean }) =>
      toggleProductionStage(orderItemId, stage, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-board"] }),
  });

  const columns: DataTableColumn<OrderItemWithContext>[] = [
    { key: "delivery", header: "Entrega", width: "9%", render: (row) => formatDate(row.deliveryDate) },
    { key: "order", header: "Orden", width: "7%", render: (row) => <span className="font-mono text-ink-soft">#{row.orderNumber}</span> },
    { key: "product", header: "Producto", width: "20%", truncate: true, render: (row) => <span className="font-medium text-ink">{row.productTypeName}</span> },
    { key: "qty", header: "Cant.", width: "6%", render: (row) => row.quantity },
    ...PRODUCTION_STAGES.map<DataTableColumn<OrderItemWithContext>>((stage) => ({
      key: stage,
      header: PRODUCTION_STAGE_LABEL[stage],
      width: `${58 / PRODUCTION_STAGES.length}%`,
      align: "center",
      render: (row) => {
        const status = row.productionStages.find((s) => s.stage === stage);
        return (
          <input
            type="checkbox"
            checked={status?.completed ?? false}
            onChange={(e) => toggleMutation.mutate({ orderItemId: row.id, stage, completed: e.target.checked })}
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

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            emptyMessage="Todavía no hay productos en producción."
            pagination={{ mode: "server", page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
          />
        )}
      </Card>
    </div>
  );
}
