import { useState } from "react";
import { ProductCategory } from "@/api/types";
import { normalizeForSearch } from "@/utils/text";
import { TextInput } from "./ui";

interface Props {
  categories: ProductCategory[];
  selectedId: string;
  onChange: (id: string) => void;
  topN?: number;
}

const VISIBLE_LIMIT = 20;

// A single-select sibling to CategorySelector: a native <select> listing every category is
// fine with a handful of them, but becomes an unsearchable wall once the catalog grows past
// a hundred or so. Search-first, same top-N-by-product-count default as CategorySelector.
export function CategoryFilterSelect({ categories, selectedId, onChange, topN = 10 }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = categories.find((category) => category.id === selectedId);
  const term = normalizeForSearch(query.trim());
  const candidates = term
    ? categories.filter((category) => normalizeForSearch(category.name).includes(term)).slice(0, VISIBLE_LIMIT)
    : [...categories].sort((a, b) => b.productCount - a.productCount).slice(0, topN);

  function pick(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div className="relative">
      <TextInput
        placeholder="Todas las categorías"
        value={open ? query : (selected?.name ?? "")}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-line bg-surface shadow-md">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick("")}
            className="block w-full border-b border-line px-3 py-2 text-left text-sm font-medium text-ink hover:bg-paper"
          >
            Todas las categorías
          </button>
          {candidates.map((category) => (
            <button
              key={category.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(category.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-paper"
            >
              <span className="text-ink">{category.name}</span>
              <span className="text-xs text-ink-soft">{category.productCount} productos</span>
            </button>
          ))}
          {candidates.length === 0 && <p className="px-3 py-2 text-sm text-ink-soft">Sin coincidencias.</p>}
          {!term && categories.length > candidates.length && (
            <p className="px-3 py-2 text-xs text-ink-soft/70">
              Mostrando las {candidates.length} categorías con más productos — escribí para buscar el resto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
