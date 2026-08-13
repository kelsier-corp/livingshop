import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAllProductCategories } from "@/api/productCategories";
import { applyPercentageIncrease, bulkUpdatePrices, fetchProductTypes } from "@/api/productTypes";
import { ProductType } from "@/api/types";
import { CategorySelector } from "@/components/CategorySelector";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Card, FieldLabel, PageHeader, PrimaryButton, TextInput } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isNumericInput, respectsMinimum } from "@/utils/number";

const PAGE_SIZE = 10;

export function PricesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [percentage, setPercentage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["product-types", { page, search: debouncedSearch, categoryIds: selectedCategoryIds, priceView: true }],
    queryFn: () =>
      fetchProductTypes({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories-all"],
    queryFn: fetchAllProductCategories,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product-types"] });

  const saveMutation = useMutation({
    mutationFn: () => bulkUpdatePrices(Object.entries(prices).map(([id, basePrice]) => ({ id, basePrice }))),
    onSuccess: () => {
      invalidate();
      setPrices({});
    },
  });

  const percentageMutation = useMutation({
    mutationFn: () =>
      applyPercentageIncrease(
        selectedCategoryIds.length === categories.length
          ? { scope: "all", percentage: Number(percentage) }
          : { scope: "categories", categoryIds: selectedCategoryIds, percentage: Number(percentage) }
      ),
    onSuccess: () => {
      invalidate();
      setPercentage("");
    },
  });

  const hasChanges = Object.keys(prices).length > 0;
  const hasInvalidPrice = Object.values(prices).some((price) => price <= 0);

  function priceFor(productType: ProductType): number {
    return prices[productType.id] ?? productType.basePrice;
  }

  const columns: DataTableColumn<ProductType>[] = [
    { key: "name", header: "Producto", width: "35%", render: (p) => <span className="font-medium text-ink">{p.name}</span> },
    {
      key: "categories",
      header: "Categorías",
      width: "35%",
      truncate: true,
      render: (p) => (p.categories.length > 0 ? p.categories.map((c) => c.name).join(", ") : "Sin categoría"),
    },
    {
      key: "price",
      header: "Precio",
      width: "30%",
      align: "right",
      render: (p) => (
        <TextInput
          type="text"
          inputMode="decimal"
          className={`ml-auto w-40 text-right font-mono ${priceFor(p) <= 0 ? "border-signal" : ""}`}
          value={priceFor(p)}
          onChange={(e) => {
            if (isNumericInput(e.target.value) && respectsMinimum(e.target.value)) {
              setPrices({ ...prices, [p.id]: Number(e.target.value) });
            }
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Precios" />

      <Card>
        <FieldLabel className="mb-2">Aumentar por porcentaje</FieldLabel>
        <p className="mb-3 text-sm text-ink-soft">
          Elegí una, varias o todas las categorías y aplicá un aumento parejo. La selección también filtra la tabla
          de abajo, para editar precios puntuales solo de esas categorías.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <CategorySelector
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={(categoryIds) => {
              setSelectedCategoryIds(categoryIds);
              setPage(1);
            }}
          />
          <div className="flex items-end gap-2">
            <div>
              <FieldLabel>Porcentaje (ej. 5 o -10)</FieldLabel>
              <TextInput
                type="text"
                inputMode="decimal"
                className="w-40"
                value={percentage}
                onChange={(e) => {
                  if (isNumericInput(e.target.value, { allowNegative: true })) setPercentage(e.target.value);
                }}
              />
            </div>
            <PrimaryButton
              disabled={
                selectedCategoryIds.length === 0 || !percentage || Number(percentage) === 0 || percentageMutation.isPending
              }
              onClick={() => percentageMutation.mutate()}
            >
              Aplicar aumento
            </PrimaryButton>
          </div>
        </div>
        {percentageMutation.isSuccess ? <p className="mt-3 text-sm text-accent-deep">Precios actualizados.</p> : null}
      </Card>

      <Card className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <FieldLabel>Buscar</FieldLabel>
          <TextInput
            placeholder="Nombre del producto…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-right">
          <PrimaryButton
            disabled={!hasChanges || hasInvalidPrice || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Guardar cambios individuales
          </PrimaryButton>
          {hasInvalidPrice && <p className="mt-1 text-xs text-signal">El precio debe ser mayor a 0.</p>}
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
            pagination={{ mode: "server", page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
          />
        )}
      </Card>
    </div>
  );
}
