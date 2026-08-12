import { useState } from "react";
import { ProductCategory } from "@/api/types";
import { TextInput } from "./ui";

interface Props {
  categories: ProductCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  topN?: number;
}

export function CategorySelector({ categories, selectedIds, onChange, topN = 10 }: Props) {
  const [query, setQuery] = useState("");
  const selectedSet = new Set(selectedIds);
  const term = query.trim().toLowerCase();

  const candidates = term
    ? categories.filter((category) => category.name.toLowerCase().includes(term)).slice(0, 20)
    : [...categories].sort((a, b) => b.productCount - a.productCount).slice(0, topN);

  const allSelected = categories.length > 0 && selectedIds.length === categories.length;
  const selectedCategories = categories.filter((category) => selectedSet.has(category.id));

  function toggle(id: string) {
    onChange(selectedSet.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : categories.map((category) => category.id));
  }

  return (
    <div>
      {selectedCategories.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-1 rounded-sm bg-accent/15 px-2 py-0.5 text-xs text-accent-deep"
            >
              {category.name}
              <button type="button" onClick={() => toggle(category.id)} className="hover:text-signal">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <TextInput
        placeholder="Buscar categoría…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mt-1 max-h-48 overflow-y-auto rounded-sm border border-line bg-surface">
        <label className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Seleccionar todas ({categories.length})
        </label>
        {candidates.map((category) => (
          <label key={category.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-paper">
            <span className="flex items-center gap-2 text-ink">
              <input
                type="checkbox"
                checked={selectedSet.has(category.id)}
                onChange={() => toggle(category.id)}
              />
              {category.name}
            </span>
            <span className="text-xs text-ink-soft">{category.productCount} productos</span>
          </label>
        ))}
        {candidates.length === 0 && <p className="px-3 py-2 text-sm text-ink-soft">Sin coincidencias.</p>}
      </div>
      {!term && categories.length > candidates.length && (
        <p className="mt-1 text-xs text-ink-soft">
          Mostrando las {candidates.length} categorías con más productos — busca por nombre para ver el resto.
        </p>
      )}
    </div>
  );
}
