import { useMemo, useState } from "react";
import { ProductCategory, ProductType } from "@/api/types";
import { normalizeForSearch } from "@/utils/text";
import { SecondaryButton, TextInput } from "./ui";

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

interface Props {
  productTypes: ProductType[];
  categories: ProductCategory[];
  selectedProductTypeId: string;
  onSelect: (productTypeId: string) => void;
}

export function ProductTypePicker({ productTypes, categories, selectedProductTypeId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const selected = productTypes.find((productType) => productType.id === selectedProductTypeId);

  const matches = useMemo(() => {
    const term = normalizeForSearch(query.trim());
    return productTypes.filter((productType) => {
      const matchesCategory = !categoryId || productType.categories.some((category) => category.id === categoryId);
      const matchesTerm = !term || normalizeForSearch(productType.name).includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [productTypes, query, categoryId]);

  function categoryLabel(productType: ProductType): string {
    return productType.categories.length > 0
      ? productType.categories.map((category) => category.name).join(", ")
      : "Sin categoría";
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-line bg-paper px-3 py-2">
        <div>
          <p className="text-sm font-medium text-ink">{selected.name}</p>
          <p className="text-xs text-ink-soft">
            {categoryLabel(selected)} · {formatCurrency(selected.basePrice)}
          </p>
        </div>
        <SecondaryButton type="button" onClick={() => onSelect("")}>
          Cambiar
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={`rounded-sm px-2 py-1 text-xs font-medium ${
            categoryId === null ? "bg-accent text-paper" : "border border-line text-ink-soft"
          }`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setCategoryId(category.id)}
            className={`rounded-sm px-2 py-1 text-xs font-medium ${
              categoryId === category.id ? "bg-accent text-paper" : "border border-line text-ink-soft"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      <TextInput
        placeholder="Buscar producto por nombre…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-1 max-h-56 overflow-y-auto rounded-sm border border-line bg-surface">
        {matches.length > 0 ? (
          <ul>
            {matches.map((productType) => (
              <li key={productType.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-paper"
                  onClick={() => onSelect(productType.id)}
                >
                  <span className="font-medium text-ink">{productType.name}</span>
                  <span className="text-xs text-ink-soft">
                    {categoryLabel(productType)} · {formatCurrency(productType.basePrice)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-2 text-sm text-ink-soft">No hay productos que coincidan.</p>
        )}
      </div>
    </div>
  );
}
