import { Fragment, ReactNode, useState } from "react";
import { SecondaryButton } from "./ui";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width: string;
  align?: "left" | "right" | "center";
  truncate?: boolean;
  render: (row: T) => ReactNode;
  sortKey?: string;
}

export interface DataTableSort {
  sortBy: string;
  direction: "asc" | "desc";
  onChange: (sortBy: string) => void;
}

interface ServerPagination {
  mode: "server";
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface ClientPagination {
  mode: "client";
  pageSize: number;
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  pagination?: ServerPagination | ClientPagination;
  emptyMessage?: string;
  sort?: DataTableSort;
  // Renders extra content in its own full-width row directly below a given row — e.g. an
  // expand/collapse detail panel triggered by a button in one of the columns. The caller owns
  // which row (if any) is expanded, since that's usually driven by a button inside a column's
  // own render(row), not something DataTable itself has a reason to know about.
  expandedRowKey?: string | null;
  renderExpandedRow?: (row: T) => ReactNode;
}

function alignClass(align?: "left" | "right" | "center"): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pagination,
  emptyMessage = "No hay resultados.",
  sort,
  expandedRowKey,
  renderExpandedRow,
}: Props<T>) {
  const [clientPage, setClientPage] = useState(1);

  const isServer = pagination?.mode === "server";
  const pageSize = pagination?.pageSize ?? (rows.length || 1);
  const total = isServer ? pagination.total : rows.length;
  const page = isServer ? pagination.page : clientPage;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visibleRows = isServer
    ? rows
    : rows.slice((clientPage - 1) * pageSize, clientPage * pageSize);

  function goToPage(target: number) {
    const clamped = Math.min(Math.max(1, target), totalPages);
    if (isServer) pagination.onPageChange(clamped);
    else setClientPage(clamped);
  }

  const showPagination = totalPages > 1;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-line text-xs uppercase text-ink-soft">
              {columns.map((column) => {
                const isSortable = !!column.sortKey && !!sort;
                const isActive = isSortable && sort!.sortBy === column.sortKey;
                return (
                  <th
                    key={column.key}
                    className={`overflow-hidden truncate whitespace-nowrap py-2 pr-2 ${alignClass(column.align)}`}
                    title={column.header}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => sort!.onChange(column.sortKey!)}
                        className="inline-flex items-center gap-1 uppercase text-ink-soft hover:text-ink"
                      >
                        {column.header}
                        <span className="text-[10px] normal-case">
                          {isActive ? (sort!.direction === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const key = rowKey(row);
              const isExpanded = !!renderExpandedRow && expandedRowKey === key;
              return (
                <Fragment key={key}>
                  <tr className="border-b border-line/60">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`py-2 pr-2 ${alignClass(column.align)} ${
                          column.truncate ? "overflow-hidden truncate whitespace-nowrap" : ""
                        }`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-line/60 bg-paper">
                      <td colSpan={columns.length} className="px-2 py-3">
                        {renderExpandedRow!(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-ink-soft">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="mt-3 flex items-center justify-between text-sm text-ink-soft">
          <span>{total} resultados</span>
          <div className="flex items-center gap-2">
            <SecondaryButton disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Anterior
            </SecondaryButton>
            <span>
              Página {page} de {totalPages}
            </span>
            <SecondaryButton disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Siguiente
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
