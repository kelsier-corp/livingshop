import { useState } from "react";
import { AttributeCatalog } from "@/api/types";
import { normalizeForSearch } from "@/utils/text";
import { TextInput } from "./ui";

interface Props {
  catalogs: AttributeCatalog[];
  selectedId: string | null;
  onChange: (id: string) => void;
}

const VISIBLE_LIMIT = 20;

// A native <select> works while there are a handful of catalogs, but becomes an unsearchable
// wall once the list grows — same tradeoff as CategoryFilterSelect/CatalogValueSelect.
export function AttributeCatalogSelect({ catalogs, selectedId, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = catalogs.find((catalog) => catalog.id === selectedId);
  const term = normalizeForSearch(query.trim());
  const matches = term
    ? catalogs.filter((catalog) => normalizeForSearch(catalog.name).includes(term)).slice(0, VISIBLE_LIMIT)
    : catalogs.slice(0, VISIBLE_LIMIT);

  function pick(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  return (
    <div className="relative">
      <TextInput
        required={!selectedId}
        placeholder="Elegir catálogo…"
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
          {matches.map((catalog) => (
            <button
              key={catalog.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(catalog.id)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
            >
              {catalog.name}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3 py-2 text-sm text-ink-soft">Sin coincidencias.</p>}
          {!term && catalogs.length > matches.length && (
            <p className="px-3 py-2 text-xs text-ink-soft/70">
              Mostrando {matches.length} de {catalogs.length} — escribí para buscar el resto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
