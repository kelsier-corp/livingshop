// Single definition of how money is rendered across the app. Prices here are whole pesos — ARS
// centavos are long gone in practice — so the fraction digits are dropped rather than showing a
// ",00" on every amount. Keeping this in one place means a future format change (decimals for
// low-value products, a second currency) is one edit instead of a hunt through every page.
export function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
