import { useMemo, type ReactNode } from 'react';
import {
  flexRender, getCoreRowModel, useReactTable, type ColumnDef, type OnChangeFn, type RowSelectionState, type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/shared/states';
import type { Page } from '@/types/common';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  page?: Page<T>;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  toolbar?: ReactNode;
  selectionActions?: (selectedIds: string[]) => ReactNode;
}

/** Tabla con paginación, orden y selección del lado del servidor (compatible con Spring Page). */
export function DataTable<T>({
  columns, page, isLoading, error, onRetry, pageIndex = 0, onPageChange, sorting, onSortingChange,
  rowSelection, onRowSelectionChange, getRowId, onRowClick, empty, toolbar, selectionActions,
}: DataTableProps<T>) {
  const selectable = !!onRowSelectionChange;
  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!selectable) return columns;
    return [
      {
        id: '__select',
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Seleccionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} onClick={(e) => e.stopPropagation()} aria-label="Seleccionar fila" />
        ),
      },
      ...columns,
    ];
  }, [columns, selectable]);

  const table = useReactTable({
    data: page?.content ?? [],
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: page?.totalPages ?? 1,
    state: { sorting: sorting ?? [], rowSelection: rowSelection ?? {} },
    onSortingChange,
    onRowSelectionChange,
    enableRowSelection: selectable,
    getRowId,
  });

  const selectedIds = Object.keys(rowSelection ?? {}).filter((k) => rowSelection?.[k]);
  const total = page?.totalElements ?? 0;
  const from = total === 0 ? 0 : pageIndex * (page?.size ?? 10) + 1;
  const to = Math.min(total, (pageIndex + 1) * (page?.size ?? 10));

  return (
    <div className="surface overflow-hidden">
      {(toolbar || (selectionActions && selectedIds.length > 0)) && (
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          {selectionActions && selectedIds.length > 0 ? (
            <div className="flex w-full flex-wrap items-center gap-3 animate-fade-up">
              <span className="text-sm font-medium">{selectedIds.length} seleccionado(s)</span>
              {selectionActions(selectedIds)}
            </div>
          ) : (
            toolbar
          )}
        </div>
      )}
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <div className="scrollbar-thin w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort() && !!onSortingChange;
                    const dir = h.column.getIsSorted();
                    return (
                      <th key={h.id} scope="col" className={cn('h-11 whitespace-nowrap px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', h.id === '__select' && 'w-10')}>
                        {h.isPlaceholder ? null : canSort ? (
                          <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 rounded hover:text-foreground">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-t">
                      {allColumns.map((_, ci) => (
                        <td key={ci} className="px-4 py-3">
                          <Skeleton className="h-5 w-full max-w-[160px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn('border-t transition-colors hover:bg-muted/40', onRowClick && 'cursor-pointer', row.getIsSelected() && 'bg-brand-soft/50')}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-4 py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && total === 0 && (empty ?? <EmptyState compact title="Sin resultados" description="No hay registros que coincidan con los filtros." />)}
        </div>
      )}
      {onPageChange && !error && (
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
          <p className="text-muted-foreground">
            {total > 0 ? `Mostrando ${formatNumber(from)}–${formatNumber(to)} de ${formatNumber(total)}` : 'Sin registros'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex === 0 || isLoading} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span className="tabular-nums text-muted-foreground">
              {pageIndex + 1} / {page?.totalPages ?? 1}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pageIndex + 1)} disabled={!page || pageIndex + 1 >= page.totalPages || isLoading} aria-label="Página siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
