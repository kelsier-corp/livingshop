import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { fetchAllProductCategories } from "@/api/productCategories";
import {
  ProductTypeInput,
  createProductType,
  deleteProductType,
  fetchProductTypes,
  removeProductSketch,
  updateProductType,
  uploadProductSketch,
} from "@/api/productTypes";
import { fetchAllAttributeCatalogs } from "@/api/attributeCatalogs";
import { AttributeDataType, ProductType } from "@/api/types";
import { AttributeCatalogSelect } from "@/components/AttributeCatalogSelect";
import { CategoryFilterSelect } from "@/components/CategoryFilterSelect";
import { CategorySelector } from "@/components/CategorySelector";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import {
  Card,
  DangerButton,
  FieldLabel,
  FileInput,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextInput,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency } from "@/utils/currency";
import { isNumericInput, respectsMinimum } from "@/utils/number";
import { ProductCategoriesTab } from "./ProductCategoriesTab";

const PAGE_SIZE = 10;
const DATA_TYPES: AttributeDataType[] = ["text", "catalog"];
const DATA_TYPE_LABEL: Record<AttributeDataType, string> = {
  text: "Texto",
  catalog: "Catálogo",
};

function emptyForm(): ProductTypeInput {
  return {
    name: "",
    description: "",
    basePrice: 0,
    categoryIds: [],
    active: true,
    includeInFactorySheet: true,
    attributeDefinitions: [],
  };
}

export function ProductTypesPage() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product-types", { page, search: debouncedSearch, categoryFilter }],
    queryFn: () =>
      fetchProductTypes({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryIds: categoryFilter ? [categoryFilter] : undefined,
      }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories-all"],
    queryFn: fetchAllProductCategories,
  });
  const { data: attributeCatalogs = [] } = useQuery({
    queryKey: ["attribute-catalogs-all"],
    queryFn: fetchAllAttributeCatalogs,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductTypeInput>(emptyForm());
  const [editingSketch, setEditingSketch] = useState<{
    url: string | null;
    fileName: string | null;
  } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["product-types"] });
    queryClient.invalidateQueries({ queryKey: ["product-categories-all"] });
  };

  const createMutation = useMutation({
    mutationFn: createProductType,
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductTypeInput }) =>
      updateProductType(id, input),
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteProductType, onSuccess: invalidate });

  const uploadSketchMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadProductSketch(id, file),
    onSuccess: (productType) => {
      invalidate();
      setEditingSketch({ url: productType.sketchUrl, fileName: productType.sketchFileName });
    },
  });

  const removeSketchMutation = useMutation({
    mutationFn: removeProductSketch,
    onSuccess: (productType) => {
      invalidate();
      setEditingSketch({ url: productType.sketchUrl, fileName: productType.sketchFileName });
    },
  });

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setEditingSketch(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(emptyForm());
    setEditingId(null);
    setEditingSketch(null);
    setShowForm(true);
  }

  function startEdit(productType: ProductType) {
    setForm({
      name: productType.name,
      description: productType.description ?? "",
      basePrice: productType.basePrice,
      categoryIds: productType.categories.map((category) => category.id),
      active: productType.active,
      includeInFactorySheet: productType.includeInFactorySheet,
      attributeDefinitions: productType.attributeDefinitions.map((attribute) => ({
        name: attribute.name,
        dataType: attribute.dataType,
        attributeCatalogId: attribute.attributeCatalogId,
        sortOrder: attribute.sortOrder,
        required: attribute.required,
      })),
    });
    setEditingId(productType.id);
    setEditingSketch({ url: productType.sketchUrl, fileName: productType.sketchFileName });
    setShowForm(true);
  }

  function handleSketchSelected(file: File) {
    if (editingId) uploadSketchMutation.mutate({ id: editingId, file });
  }

  function handleDeleteSketch(id: string) {
    if (window.confirm("¿Eliminar este croquis? Esta acción no se puede deshacer.")) {
      removeSketchMutation.mutate(id);
    }
  }

  function addAttributeRow() {
    setForm({
      ...form,
      attributeDefinitions: [
        ...form.attributeDefinitions,
        {
          name: "",
          dataType: "text",
          attributeCatalogId: null,
          sortOrder: form.attributeDefinitions.length,
          required: false,
        },
      ],
    });
  }

  function removeAttributeRow(index: number) {
    setForm({
      ...form,
      attributeDefinitions: form.attributeDefinitions.filter((_, i) => i !== index),
    });
  }

  function updateAttributeRow(
    index: number,
    patch: Partial<ProductTypeInput["attributeDefinitions"][number]>
  ) {
    setForm({
      ...form,
      attributeDefinitions: form.attributeDefinitions.map((attribute, i) =>
        i === index ? { ...attribute, ...patch } : attribute
      ),
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, input: form });
    else createMutation.mutate(form);
  }

  const columns: DataTableColumn<ProductType>[] = [
    {
      key: "name",
      header: "Nombre",
      width: "22%",
      render: (p) => <span className="font-medium text-ink">{p.name}</span>,
    },
    {
      key: "description",
      header: "Descripción",
      width: "26%",
      truncate: true,
      render: (p) => p.description ?? "-",
    },
    {
      key: "categories",
      header: "Categorías",
      width: "20%",
      truncate: true,
      render: (p) =>
        p.categories.length > 0 ? p.categories.map((c) => c.name).join(", ") : "Sin categoría",
    },
    {
      key: "price",
      header: "Precio",
      width: "14%",
      align: "right",
      render: (p) => <span className="font-mono">{formatCurrency(p.basePrice)}</span>,
    },
    {
      key: "actions",
      header: "",
      width: "18%",
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => startEdit(p)}>Editar</SecondaryButton>
          <DangerButton onClick={() => deleteMutation.mutate(p.id)}>Eliminar</DangerButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Productos"
        actions={
          tab === "products" && <PrimaryButton onClick={startCreate}>Nuevo producto</PrimaryButton>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-line">
        {(["products", "categories"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? "border-accent text-accent-deep"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {value === "products" ? "Productos" : "Categorías"}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <ProductCategoriesTab />
      ) : (
        <>
          <Card className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Buscar</FieldLabel>
                <TextInput
                  placeholder="Nombre del producto…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <FieldLabel>Categoría</FieldLabel>
                <CategoryFilterSelect
                  categories={categories}
                  selectedId={categoryFilter}
                  onChange={(id) => {
                    setCategoryFilter(id);
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
                rowKey={(p) => p.id}
                emptyMessage="No hay productos que coincidan con el filtro."
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
        </>
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingId ? "Editar producto" : "Nuevo producto"}
        width="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Nombre</FieldLabel>
              <TextInput
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Precio</FieldLabel>
              <TextInput
                type="text"
                inputMode="decimal"
                required
                value={form.basePrice}
                onChange={(e) => {
                  if (isNumericInput(e.target.value) && respectsMinimum(e.target.value)) {
                    setForm({ ...form, basePrice: Number(e.target.value) });
                  }
                }}
              />
              {form.basePrice <= 0 && (
                <p className="mt-1 text-xs text-signal">El precio debe ser mayor a 0.</p>
              )}
            </div>
            <div className="col-span-2">
              <FieldLabel>Descripción</FieldLabel>
              <TextInput
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>Categorías (opcional)</FieldLabel>
              <CategorySelector
                categories={categories}
                selectedIds={form.categoryIds}
                onChange={(categoryIds) => setForm({ ...form, categoryIds })}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.includeInFactorySheet ?? true}
                  onChange={(e) => setForm({ ...form, includeInFactorySheet: e.target.checked })}
                />
                Incluir en la ficha técnica y la planilla de producción
              </label>
              <p className="mt-1 text-xs text-ink-soft/70">
                Desmarcá esto para productos sin trabajo de fábrica (ej. flete, instalación) — no
                van a aparecer en la ficha técnica ni en la planilla de producción de ninguna orden
                que los incluya.
              </p>
            </div>
            <div className="col-span-2">
              <FieldLabel>Croquis</FieldLabel>
              {!editingId ? (
                <p className="text-xs text-ink-soft">
                  Guardá el producto primero para poder subir el croquis.
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  {editingSketch?.url ? (
                    <div className="w-24">
                      <img
                        src={editingSketch.url}
                        alt={editingSketch.fileName ?? "Croquis"}
                        className="h-24 w-24 rounded-sm border border-line object-cover"
                      />
                      <button
                        type="button"
                        className="mt-1 text-xs text-signal hover:underline disabled:opacity-50"
                        disabled={removeSketchMutation.isPending}
                        onClick={() => editingId && handleDeleteSketch(editingId)}
                      >
                        eliminar
                      </button>
                    </div>
                  ) : (
                    <FileInput
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSketchSelected(file);
                        e.target.value = "";
                      }}
                    />
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-ink-soft/70">
                Formatos aceptados: JPG o PNG (se imprime en la ficha técnica). Tamaño máximo 8MB.
              </p>
              {uploadSketchMutation.isError && (
                <p className="mt-1 text-xs text-signal">No se pudo subir el croquis.</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel className="mb-0">Atributos</FieldLabel>
              <SecondaryButton type="button" onClick={addAttributeRow}>
                Agregar atributo
              </SecondaryButton>
            </div>
            <div className="space-y-2">
              {form.attributeDefinitions.map((attribute, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 rounded-md border border-line p-2"
                >
                  <div className="col-span-4">
                    <TextInput
                      placeholder="Nombre del atributo"
                      value={attribute.name}
                      onChange={(e) => updateAttributeRow(index, { name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={attribute.dataType}
                      onChange={(e) =>
                        updateAttributeRow(index, {
                          dataType: e.target.value as AttributeDataType,
                          attributeCatalogId:
                            e.target.value === "catalog" ? attribute.attributeCatalogId : null,
                        })
                      }
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {DATA_TYPE_LABEL[type]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-3">
                    {attribute.dataType === "catalog" ? (
                      <AttributeCatalogSelect
                        catalogs={attributeCatalogs}
                        selectedId={attribute.attributeCatalogId}
                        onChange={(id) => updateAttributeRow(index, { attributeCatalogId: id })}
                      />
                    ) : (
                      <span className="text-xs text-ink-soft">Texto libre en la orden</span>
                    )}
                  </div>
                  <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-ink-soft">
                    <input
                      type="checkbox"
                      checked={attribute.required ?? false}
                      onChange={(e) => updateAttributeRow(index, { required: e.target.checked })}
                    />
                    req.
                  </label>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      className="text-xs text-signal hover:underline"
                      onClick={() => removeAttributeRow(index)}
                    >
                      quitar
                    </button>
                  </div>
                </div>
              ))}
              {form.attributeDefinitions.length === 0 && (
                <p className="text-xs text-ink-soft">
                  Todavía no hay atributos — agregá al menos uno.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <PrimaryButton
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || form.basePrice <= 0}
            >
              {editingId ? "Guardar cambios" : "Crear producto"}
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
