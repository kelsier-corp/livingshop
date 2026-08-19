import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
} from "@/api/paymentMethods";
import { PaymentMethod } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Card, DangerButton, FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/ui";

export function PaymentMethodsTab() {
  const queryClient = useQueryClient();
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] });

  const createMutation = useMutation({ mutationFn: createPaymentMethod, onSuccess: () => { invalidate(); closeForm(); } });
  const updateMutation = useMutation({
    mutationFn: ({ id, name: newName, active: newActive }: { id: string; name: string; active: boolean }) =>
      updatePaymentMethod(id, newName, newActive),
    onSuccess: () => { invalidate(); closeForm(); },
  });
  const deleteMutation = useMutation({ mutationFn: deletePaymentMethod, onSuccess: invalidate });

  function closeForm() {
    setName("");
    setActive(true);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setName("");
    setActive(true);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(method: PaymentMethod) {
    setName(method.name);
    setActive(method.active);
    setEditingId(method.id);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, name, active });
    else createMutation.mutate(name);
  }

  const columns: DataTableColumn<PaymentMethod>[] = [
    {
      key: "name",
      header: "Nombre",
      width: "45%",
      render: (m) => <span className={m.active ? "font-medium text-ink" : "text-ink-soft/60 line-through"}>{m.name}</span>,
    },
    { key: "active", header: "Activo", width: "20%", render: (m) => (m.active ? "Sí" : "No") },
    {
      key: "actions",
      header: "",
      width: "35%",
      align: "right",
      render: (m) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => startEdit(m)}>Editar</SecondaryButton>
          <DangerButton onClick={() => deleteMutation.mutate(m.id)}>Eliminar</DangerButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <PrimaryButton onClick={startCreate}>Nuevo método</PrimaryButton>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={methods}
            rowKey={(m) => m.id}
            emptyMessage="Todavía no hay métodos de pago."
            pagination={{ mode: "client", pageSize: 10 }}
          />
        )}
      </Card>

      <Modal open={showForm} onClose={closeForm} title={editingId ? "Editar método de pago" : "Nuevo método de pago"} width="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <TextInput required placeholder="ej. Efectivo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {editingId && (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Activo (disponible para elegir al cargar un pago nuevo)
            </label>
          )}
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Guardar cambios" : "Crear método"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={closeForm}>
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
