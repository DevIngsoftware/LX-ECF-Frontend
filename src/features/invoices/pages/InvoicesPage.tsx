import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { FilePlus2, FileText, SlidersHorizontal } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { DgiiStatusBadge, InternalStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { useTableQuery } from '@/hooks/use-table-query';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import type { InvoiceSummary } from '@/types/ecf';
import { formatDate, formatMoney } from '@/utils/format';
import { EcfTypeTag } from '../components/EcfTypeTag';
import { BulkActions } from '../components/list/BulkActions';
import {
  EMPTY_FILTERS, InvoiceFilterFields, activeFilterCount, toServiceFilters, type InvoiceFilterState,
} from '../components/list/InvoiceFilterFields';
import { InvoiceRowActions } from '../components/list/InvoiceRowActions';
import { useCheckStatus, useInvoiceDownloads } from '../lib/use-invoice-actions';

export function InvoicesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEmit = hasPermission('invoices.emit');
  const t = useTableQuery({ sort: [{ id: 'issueDate', desc: true }] });
  const [filters, setFiltersState] = useState<InvoiceFilterState>(EMPTY_FILTERS);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const seen = useRef(new Map<string, InvoiceSummary>());
  const { download } = useInvoiceDownloads();
  const { mutate: checkStatusMutate } = useCheckStatus();

  const setFilters = (next: InvoiceFilterState) => {
    setFiltersState(next);
    t.resetPage();
  };

  const query = { ...t.query, ...toServiceFilters(filters) };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.invoices(query),
    queryFn: () => invoicesService.list(query),
    placeholderData: keepPreviousData,
  });
  data?.content.forEach((i) => seen.current.set(i.id, i));

  const columns = useMemo<ColumnDef<InvoiceSummary, unknown>[]>(
    () => [
      {
        id: 'encf',
        accessorKey: 'encf',
        header: 'e-NCF',
        cell: ({ row }) => (
          <Link to={ROUTES.app.invoice(row.original.id)} onClick={(e) => e.stopPropagation()} className="font-mono text-xs font-semibold hover:text-brand hover:underline">
            {row.original.encf}
          </Link>
        ),
      },
      { id: 'type', accessorKey: 'type', header: 'Tipo', cell: ({ row }) => <EcfTypeTag type={row.original.type} /> },
      {
        id: 'buyerName',
        accessorKey: 'buyerName',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="max-w-[220px] truncate font-medium">{row.original.buyerName}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.buyerRnc ?? 'Sin RNC'}</p>
          </div>
        ),
      },
      { id: 'issueDate', accessorKey: 'issueDate', header: 'Fecha', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
      { id: 'total', accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-semibold tabular-nums">{formatMoney(row.original.total)}</span> },
      { id: 'internalStatus', header: 'Estado interno', enableSorting: false, cell: ({ row }) => <InternalStatusBadge status={row.original.internalStatus} /> },
      { id: 'dgiiStatus', header: 'Estado DGII', enableSorting: false, cell: ({ row }) => <DgiiStatusBadge status={row.original.dgiiStatus} /> },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <InvoiceRowActions
            invoice={row.original}
            canEmit={canEmit}
            onDownload={(inv, kind) => void download(inv.id, kind, inv.encf)}
            onCheckStatus={(inv) => checkStatusMutate(inv.id)}
          />
        ),
      },
    ],
    [canEmit, download, checkStatusMutate],
  );

  const filterCount = activeFilterCount(filters);
  const pristine = !t.search && filterCount === 0;

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Facturación electrónica"
        title="Comprobantes"
        description="Consulta los e-CF emitidos. El estado interno refleja el registro en LX e-CF; el estado DGII refleja la respuesta de la DGII."
        actions={
          canEmit && (
            <Button asChild>
              <Link to={ROUTES.app.newInvoice}><FilePlus2 /> Nueva factura</Link>
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        pageIndex={t.pageIndex}
        onPageChange={t.setPageIndex}
        sorting={t.sorting}
        onSortingChange={t.setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(r) => r.id}
        onRowClick={(r) => navigate(ROUTES.app.invoice(r.id))}
        selectionActions={(ids) => <BulkActions ids={ids} lookup={(id) => seen.current.get(id)} onClear={() => setRowSelection({})} />}
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full items-center gap-2">
              <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por e-NCF, cliente o RNC" className="flex-1 sm:w-80 sm:flex-none" />
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-10 shrink-0 lg:hidden" aria-label="Filtros">
                    <SlidersHorizontal />
                    <span className="hidden sm:inline">Filtros</span>
                    {filterCount > 0 && <Badge variant="brand" className="px-1.5">{filterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Filtros</SheetTitle>
                    <SheetDescription>Refina la lista de comprobantes.</SheetDescription>
                  </SheetHeader>
                  <InvoiceFilterFields value={filters} onChange={setFilters} layout="stacked" />
                  <SheetFooter className="mt-6 flex-row gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar</Button>
                    <Button className="flex-1" onClick={() => setSheetOpen(false)}>Ver resultados</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              {isFetching && !isLoading && <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Actualizando…</span>}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <InvoiceFilterFields value={filters} onChange={setFilters} layout="inline" />
              {filterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Limpiar filtros</Button>
              )}
            </div>
          </div>
        }
        empty={
          pristine ? (
            <EmptyState
              compact
              icon={FileText}
              title="Aún no has emitido comprobantes"
              description="Cuando emitas tu primer e-CF aparecerá aquí con su estado interno y su estado en la DGII."
              action={canEmit && <Button size="sm" asChild><Link to={ROUTES.app.newInvoice}><FilePlus2 /> Nueva factura</Link></Button>}
            />
          ) : undefined
        }
      />
    </PageTransition>
  );
}
