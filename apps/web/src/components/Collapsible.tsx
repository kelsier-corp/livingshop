import { ReactNode, useState } from "react";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export function Collapsible({ title, subtitle, defaultOpen = true, actions, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span
            className={`font-mono text-xs text-ink-soft transition-transform ${open ? "rotate-90" : ""}`}
          >
            ▸
          </span>
          <span className="font-display text-base font-semibold text-ink">{title}</span>
          {subtitle ? <span className="text-xs text-ink-soft">{subtitle}</span> : null}
        </button>
        {actions}
      </div>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
