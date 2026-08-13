import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import {
  addAttributeCatalogValue,
  createAttributeCatalog,
  deleteAttributeCatalog,
  deleteAttributeCatalogValue,
  fetchAttributeCatalogs,
  updateAttributeCatalogValue,
} from "@/api/attributeCatalogs";
import { AttributeCatalog, AttributeCatalogValue } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Card, DangerButton, FieldLabel, PageHeader, PrimaryButton, SecondaryButton, TextInput } from "@/components/ui";
import { PaymentMethodsTab } from "./PaymentMethodsTab";

export function AttributeCatalogsPage() {
  const [tab, setTab] = useState<"attributes" | "payment-methods">("attributes");
  const queryClient = useQueryClient();
  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ["attribute-catalogs"],
    queryFn: fetchAttributeCatalogs,
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCatalogName, setNewCatalogName] = useState("");
  const [managingCatalogId, setManagingCatalogId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["attribute-catalogs"] });

  const createCatalogMutation = useMutation({
    mutationFn: createAttributeCatalog,
    onSuccess: () => {
      invalidate();
      setNewCatalogName("");
      setShowCreateForm(false);
    },
  });
  const deleteCatalogMutation = useMutation({ mutationFn: deleteAttributeCatalog, onSuccess: invalidate });
  const addValueMutation = useMutation({
    mutationFn: ({ catalogId, value }: { catalogId: string; value: string }) =>
      addAttributeCatalogValue(catalogId, value),
    onSuccess: () => {
      invalidate();
      setNewValue("");
    },
  });
  const toggleValueMutation = useMutation({
    mutationFn: ({ catalogId, valueId, value, active }: { catalogId: string; valueId: string; value: string; active: boolean }) =>
      updateAttributeCatalogValue(catalogId, valueId, value, active),
    onSuccess: invalidate,
  });
  const deleteValueMutation = useMutation({
    mutationFn: ({ catalogId, valueId }: { catalogId: string; valueId: string }) =>
      deleteAttributeCatalogValue(catalogId, valueId),
    onSuccess: invalidate,
  });

  function handleCreateCatalog(e: FormEvent) {
    e.preventDefault();
    if (newCatalogName.trim()) createCatalogMutation.mutate(newCatalogName.trim());
  }

  function handleAddValue(e: FormEvent) {
    e.preventDefault();
    if (managingCatalogId && newValue.trim()) {
      addValueMutation.mutate({ catalogId: managingCatalogId, value: newValue.trim() });
    }
  }

  const managingCatalog = catalogs.find((catalog) => catalog.id === managingCatalogId) ?? null;

  const columns: DataTableColumn<AttributeCatalog>[] = [
    { key: "name", header: "Nombre", width: "40%", render: (c) => <span className="font-medium text-ink">{c.name}</span> },
    { key: "count", header: "Valores", width: "20%", align: "right", render: (c) => c.values.length },
    {
      key: "actions",
      header: "",
      width: "40%",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => setManagingCatalogId(c.id)}>Gestionar valores</SecondaryButton>
          <DangerButton onClick={() => deleteCatalogMutation.mutate(c.id)}>Eliminar</DangerButton>
        </div>
      ),
    },
  ];

  const valueColumns: DataTableColumn<AttributeCatalogValue>[] = [
    {
      key: "value",
      header: "Valor",
      width: "55%",
      render: (v) => <span className={v.active ? "text-ink" : "text-ink-soft/60 line-through"}>{v.value}</span>,
    },
    {
      key: "active",
      header: "Activo",
      width: "20%",
      align: "center",
      render: (v) => (
        <input
          type="checkbox"
          checked={v.active}
          onChange={(e) =>
            managingCatalogId &&
            toggleValueMutation.mutate({ catalogId: managingCatalogId, valueId: v.id, value: v.value, active: e.target.checked })
          }
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "25%",
      align: "right",
      render: (v) => (
        <button
          type="button"
          className="text-xs text-signal hover:underline"
          onClick={() => managingCatalogId && deleteValueMutation.mutate({ catalogId: managingCatalogId, valueId: v.id })}
        >
          quitar
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Catálogos"
        actions={
          tab === "attributes" && (
            <PrimaryButton onClick={() => setShowCreateForm(true)}>Nuevo catálogo</PrimaryButton>
          )
        }
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        {(["attributes", "payment-methods"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === value ? "border-accent text-accent-deep" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {value === "attributes" ? "Atributos" : "Métodos de pago"}
          </button>
        ))}
      </div>

      {tab === "payment-methods" ? (
        <PaymentMethodsTab />
      ) : (
        <Card>
          {isLoading ? (
            <p className="text-sm text-ink-soft">Cargando…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={catalogs}
              rowKey={(c) => c.id}
              emptyMessage="Todavía no hay catálogos."
              pagination={{ mode: "client", pageSize: 10 }}
            />
          )}
        </Card>
      )}

      <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)} title="Nuevo catálogo" width="max-w-md">
        <form onSubmit={handleCreateCatalog} className="space-y-4">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <TextInput
              required
              placeholder="ej. Tela"
              value={newCatalogName}
              onChange={(e) => setNewCatalogName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={createCatalogMutation.isPending}>
              Crear catálogo
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!managingCatalog}
        onClose={() => setManagingCatalogId(null)}
        title={managingCatalog ? `Valores de "${managingCatalog.name}"` : ""}
        width="max-w-xl"
      >
        {managingCatalog && (
          <div className="space-y-4">
            <DataTable
              columns={valueColumns}
              rows={managingCatalog.values}
              rowKey={(v) => v.id}
              emptyMessage="Todavía no hay valores."
              pagination={{ mode: "client", pageSize: 8 }}
            />
            <form onSubmit={handleAddValue} className="flex gap-2 border-t border-line pt-4">
              <TextInput placeholder="Valor nuevo" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <SecondaryButton type="submit" disabled={addValueMutation.isPending}>
                Agregar
              </SecondaryButton>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
