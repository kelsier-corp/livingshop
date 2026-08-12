// Rejects a keystroke that would make a numeric input go below `min`, so the field never
// holds a negative (or otherwise out-of-range) value in state — relying only on the native
// `min` attribute isn't enough, since browsers still let you type past it.
export function respectsMinimum(rawValue: string, min = 0): boolean {
  if (rawValue.trim() === "") return true;
  const parsed = Number(rawValue);
  return !Number.isNaN(parsed) && parsed >= min;
}
