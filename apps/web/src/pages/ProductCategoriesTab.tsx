import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import {
  createProductCategory,
  deleteProductCategory,
  fetchProductCategories,
  updateProductCategory,
} from "@/api/productCategories";
import { ProductCategory } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import {
  Card,
  DangerButton,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PAGE_SIZE = 10;

export function ProductCategoriesTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product-categories", { page, search: debouncedSearch }],
    queryFn: () =>
      fetchProductCategories({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    queryClient.invalidateQueries({ queryKey: ["product-categories-all"] });
  };

  const createMutation = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, name: newName }: { id: string; name: string }) =>
      updateProductCategory(id, newName),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteProductCategory, onSuccess: invalidate });

  function closeForm() {
    setName("");
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setName("");
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(category: ProductCategory) {
    setName(category.name);
    setEditingId(category.id);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, name });
    else createMutation.mutate(name);
  }

  const columns: DataTableColumn<ProductCategory>[] = [
    {
      key: "name",
      header: "Nombre",
      width: "50%",
      render: (c) => <span className="font-medium text-ink">{c.name}</span>,
    },
    {
      key: "count",
      header: "Productos asociados",
      width: "25%",
      align: "right",
      render: (c) => c.productCount,
    },
    {
      key: "actions",
      header: "",
      width: "25%",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => startEdit(c)}>Editar</SecondaryButton>
          <DangerButton onClick={() => deleteMutation.mutate(c.id)}>Eliminar</DangerButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <FieldLabel>Buscar</FieldLabel>
            <TextInput
              placeholder="Nombre de la categoría…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <PrimaryButton onClick={startCreate}>Nueva categoría</PrimaryButton>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(c) => c.id}
            emptyMessage="No hay categorías que coincidan con el filtro."
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
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Editar categoría" : "Nueva categoría"}
        width="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <PrimaryButton
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Guardar cambios" : "Crear categoría"}
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
