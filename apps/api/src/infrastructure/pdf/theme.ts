import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  ink: "#2a2420",
  muted: "#6b6156",
  subtle: "#9a9184",
  border: "#dad2c3",
  panel: "#f4f1e9",
  accent: "#3f5b4e",
};

export const baseStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: colors.ink,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
  },
  brand: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
  },
  brandSubtitle: {
    fontSize: 8.5,
    color: colors.muted,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    textAlign: "right",
  },
  docMeta: {
    fontSize: 8.5,
    color: colors.muted,
    textAlign: "right",
    marginTop: 2,
  },
  emphasisMeta: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    textAlign: "right",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 3,
    padding: 10,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    color: colors.muted,
    fontSize: 8.5,
  },
  value: {
    color: colors.ink,
    fontSize: 9.5,
  },
  tableHeaderRow: {
    flexDirection: "row",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 8.5,
    color: colors.ink,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7.5,
    color: colors.subtle,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
});

export function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR");
}

// Printing the same factory sheet twice in one day is common (a correction, a re-check) —
// showing only the date makes it impossible to tell which printout is the current one.
export function formatDateTime(value: Date | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
