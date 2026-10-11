import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Inbox, Info } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import { useTableQuery } from '@/hooks/use-table-query';
import { receptionService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { ReceivedDocument } from '@/types/business';
import { formatDate, formatMoney } from '@/utils/format';
import { RECEPTION_STATUS, receptionStatusMeta } from '../components/reception-meta';
import { ReceivedDocumentSheet } from '../components/ReceivedDocumentSheet';

const STATUS_FILTERS = ['ALL', ...Object.keys(RECEPTION_STATUS)];

export function ReceptionPage() {
  const t = useTableQuery({ sort: [{ id: 'receivedAt', desc: true }] });
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState<ReceivedDocument | null>(null);

  const query = { ...t.query, status };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.reception(query),
    queryFn: () => receptionService.list(query),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<ColumnDef<ReceivedDocument, unknown>[]>(
    () => [
      { id: 'encf', accessorKey: 'encf', header: 'e-NCF', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.encf}</span> },
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => <Badge variant="neutral" title={ECF_TYPE_MAP[row.original.type]?.name}>{row.original.type}</Badge>,
      },
      {
        id: 'supplierName',
        accessorKey: 'supplierName',
        header: 'Proveedor',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="max-w-[240px] truncate font-medium">{row.original.supplierName}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.supplierRnc}</p>
          </div>
        ),
      },
      { id: 'issueDate', accessorKey: 'issueDate', header: 'Emisión', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
      { id: 'receivedAt', accessorKey: 'receivedAt', header: 'Recibido', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.receivedAt)}</span> },
      { id: 'itbis', accessorKey: 'itbis', header: 'ITBIS', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.itbis == null ? '—' : formatMoney(row.original.itbis)}</span> },
      { id: 'total', accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.total)}</span> },
      {
        id: 'status',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => {
          const m = receptionStatusMeta(String(row.original.status));
          return <StatusBadge label={m.label} tone={m.tone} />;
        },
      },
    ],
    [],
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Módulo"
        title="Recepción de e-CF"
        description="Comprobantes electrónicos emitidos a tu empresa por tus proveedores."
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border bg-info-soft/60 px-4 py-3 text-sm text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>El estado mostrado corresponde a la recepción del documento. La validez fiscal la determina la DGII sobre el comprobante del emisor.</p>
      </div>

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
        getRowId={(r) => r.id}
        onRowClick={setSelected}
        toolbar={
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por e-NCF, proveedor o RNC" />
            <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
              <ToggleGroup
                type="single"
                value={status}
                onValueChange={(v) => {
                  if (!v) return;
                  setStatus(v);
                  t.resetPage();
                }}
                className="inline-flex rounded-lg border bg-card p-1"
                aria-label="Filtrar por estado"
              >
                {STATUS_FILTERS.map((s) => (
                  <ToggleGroupItem key={s} value={s} className="h-8 whitespace-nowrap rounded-md px-3 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background">
                    {s === 'ALL' ? 'Todos' : RECEPTION_STATUS[s].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        }
        empty={
          !t.search && status === 'ALL' ? (
            <EmptyState compact icon={Inbox} title="Bandeja vacía" description="Cuando tus proveedores te emitan comprobantes electrónicos aparecerán aquí." />
          ) : undefined
        }
      />

      <ReceivedDocumentSheet doc={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </PageTransition>
  );
}
