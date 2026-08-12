import { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-line bg-surface p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-sm bg-accent px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-accent-deep disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-sm border border-line bg-paper px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function DangerButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-sm border border-signal/30 bg-paper px-3.5 py-1.5 text-sm font-medium text-signal transition-colors hover:bg-signal/10 disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-sm border border-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}

// A bare <input type="file"> renders the browser's own barely-visible link-style text on most
// platforms — styling the ::file-selector-button pseudo-element (Tailwind's `file:` variant)
// makes it read as an actual button, consistent with SecondaryButton.
export function FileInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="file"
      className={`text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-line file:bg-paper file:px-3.5 file:py-1.5 file:text-sm file:font-medium file:text-ink-soft file:transition-colors hover:file:border-accent hover:file:text-accent ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-sm border border-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-sm border border-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft ${props.className ?? ""}`}
    />
  );
}

const BADGE_TONE: Record<string, string> = {
  slate: "bg-ink/10 text-ink-soft",
  green: "bg-accent/15 text-accent-deep",
  amber: "bg-signal/15 text-signal",
  red: "bg-red-500/10 text-red-700",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium ${BADGE_TONE[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink-soft">
      {message}
    </p>
  );
}
