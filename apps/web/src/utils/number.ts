// Rejects a keystroke that would make a numeric input go below `min`, so the field never
// holds an out-of-range value in state.
export function respectsMinimum(rawValue: string, min = 0): boolean {
  if (rawValue.trim() === "") return true;
  const parsed = Number(rawValue);
  return !Number.isNaN(parsed) && parsed >= min;
}

export interface NumericInputOptions {
  allowNegative?: boolean;
  allowDecimal?: boolean;
}

// We use type="text" instead of the native <input type="number"> across the app — the native
// version has its own set of rough edges (scroll-to-change, spinner arrows, silently accepting
// things like "1e5" or "Infinity" as valid numbers). This restricts a text input to characters
// that could plausibly build up a number as the user types it — digits, at most one decimal
// point, and a leading minus sign where negatives make sense (e.g. a percentage discount) — so
// the field behaves like a number input without inheriting those quirks. Pair it with
// `respectsMinimum` (or an equivalent bound check) for the actual value-range rule.
export function isNumericInput(rawValue: string, { allowNegative = false, allowDecimal = true }: NumericInputOptions = {}): boolean {
  const sign = allowNegative ? "-?" : "";
  const pattern = allowDecimal ? new RegExp(`^${sign}\\d*\\.?\\d*$`) : new RegExp(`^${sign}\\d*$`);
  return pattern.test(rawValue);
}
