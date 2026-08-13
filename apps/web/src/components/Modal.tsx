import { ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, title, onClose, children, width = "max-w-2xl" }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-6">
      <div className={`w-full ${width} rounded-md border border-line bg-surface shadow-lg`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-ink-soft hover:text-signal"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
