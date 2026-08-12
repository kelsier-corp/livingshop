import { useState } from "react";
import { AttributeCatalogValue } from "@/api/types";
import { TextInput } from "./ui";

interface Props {
  values: AttributeCatalogValue[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const VISIBLE_LIMIT = 20;

// A native <select> is fine for a handful of options, but some attribute catalogs (fabric
// colors, finishes) can realistically grow past 100 — scrolling an unsearchable dropdown that
// long is painful. This searches/filters instead, the same way CustomerPicker/ProductTypePicker do.
export function CatalogValueSelect({ values, value, onChange, required }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const activeValues = values.filter((v) => v.active);
  const term = query.trim().toLowerCase();
  const matches = term
    ? activeValues.filter((v) => v.value.toLowerCase().includes(term))
    : activeValues.slice(0, VISIBLE_LIMIT);

  function pick(pickedValue: string) {
    onChange(pickedValue);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <TextInput
        required={required && !value}
        placeholder="Buscar…"
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setOpen(false)}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-sm border border-line bg-surface shadow-md">
          {matches.map((v) => (
            <button
              key={v.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(v.value)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
            >
              {v.value}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3 py-2 text-sm text-ink-soft">Sin coincidencias.</p>}
          {!term && activeValues.length > matches.length && (
            <p className="px-3 py-2 text-xs text-ink-soft/70">
              Mostrando {matches.length} de {activeValues.length} — escribí para buscar el resto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
