import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { History } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { EmptyState } from '@/components/shared/states';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { ApiLogEntry } from '@/types/platform';
import type { Page } from '@/types/common';
import { formatDateTime, formatNumber } from '@/utils/format';
import { DocHeader } from '../components/doc-ui';
import { HttpStatusBadge, MethodBadge } from '../components/MethodBadge';

type StatusFilter = 'all' | 'ok' | 'client' | 'server';
const PAGE_SIZE = 10;

const matches = (s: number, f: StatusFilter) => f === 'all' || (f === 'ok' && s < 400) || (f === 'client' && s >= 400 && s < 500) || (f === 'server' && s >= 500);

const columns: ColumnDef<ApiLogEntry, unknown>[] = [
  { id: 'at', header: 'Fecha', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatDateTime(row.original.at)}</span> },
  { id: 'method', header: 'Método', cell: ({ row }) => <MethodBadge method={row.original.method} /> },
  { id: 'path', header: 'Ruta', cell: ({ row }) => <code className="font-mono text-xs">{row.original.path}</code> },
  { id: 'status', header: 'Estado', cell: ({ row }) => <HttpStatusBadge status={row.original.status} /> },
  { id: 'latency', header: 'Latencia', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatNumber(row.original.latencyMs)} ms</span> },
];

export function HistorySection() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.apiLogs, queryFn: () => developersService.logs() });

  // El servicio devuelve la lista completa: se pagina y filtra en el cliente.
  const page = useMemo<Page<ApiLogEntry> | undefined>(() => {
    if (!data) return undefined;
    const list = data.filter((l) => matches(l.status, filter));
    return {
      content: list.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE),
      page: pageIndex,
      size: PAGE_SIZE,
      totalElements: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / PAGE_SIZE)),
    };
  }, [data, filter, pageIndex]);

  return (
    <>
      <DocHeader eyebrow="Mi cuenta" title="Historial de solicitudes" description="Registro de las solicitudes recientes realizadas con tus credenciales." />
      <DataTable
        columns={columns}
        page={page}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        getRowId={(r) => r.id}
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Las solicitudes no incluyen cuerpos ni secretos.</p>
            <Select value={filter} onValueChange={(v) => { setFilter(v as StatusFilter); setPageIndex(0); }}>
              <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrar por resultado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los resultados</SelectItem>
                <SelectItem value="ok">Exitosas (2xx/3xx)</SelectItem>
                <SelectItem value="client">Errores de cliente (4xx)</SelectItem>
                <SelectItem value="server">Errores de servidor (5xx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        empty={filter === 'all' ? <EmptyState compact icon={History} title="Sin solicitudes registradas" description="Aún no hay actividad de tus credenciales." /> : undefined}
      />
    </>
  );
}
