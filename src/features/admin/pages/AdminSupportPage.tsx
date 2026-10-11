import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { LifeBuoy } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { useTableQuery } from '@/hooks/use-table-query';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { Page } from '@/types/common';
import type { SupportTicket } from '@/types/platform';
import { formatRelative } from '@/utils/format';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../components/admin-meta';
import { FilterSelect } from '../components/FilterSelect';
import { TicketSheet } from '../components/TicketSheet';

export function AdminSupportPage() {
  const t = useTableQuery({ sort: [{ id: 'updatedAt', desc: true }] });
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const query = { ...t.query, status: status === 'ALL' ? undefined : status, priority: priority === 'ALL' ? undefined : priority };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.admin.tickets(query),
    queryFn: () => adminService.tickets(query),
    placeholderData: keepPreviousData,
  });

  // La firma del servicio no declara "priority": se envía igualmente y se asegura el filtro sobre la página recibida.
  const page = useMemo<Page<SupportTicket> | undefined>(
    () => (data && priority !== 'ALL' ? { ...data, content: data.content.filter((x) => x.priority === priority) } : data),
    [data, priority],
  );

  const columns = useMemo<ColumnDef<SupportTicket, unknown>[]>(
    () => [
      { id: 'id', accessorKey: 'id', header: 'Ticket', cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
      {
        id: 'subject',
        accessorKey: 'subject',
        header: 'Asunto',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-medium">{row.original.subject}</p>
            <p className="max-w-[260px] truncate text-xs text-muted-foreground">{row.original.company}</p>
          </div>
        ),
      },
      { id: 'priority', header: 'Prioridad', enableSorting: false, cell: ({ row }) => <GenericStatusBadge status={row.original.priority} /> },
      { id: 'status', header: 'Estado', enableSorting: false, cell: ({ row }) => <GenericStatusBadge status={row.original.status} /> },
      { id: 'assignee', header: 'Asignado', enableSorting: false, cell: ({ row }) => <span className="text-muted-foreground">{row.original.assignee ?? 'Sin asignar'}</span> },
      { id: 'updatedAt', accessorKey: 'updatedAt', header: 'Actualizado', cell: ({ row }) => <span className="text-muted-foreground">{formatRelative(row.original.updatedAt)}</span> },
    ],
    [],
  );

  const noFilters = !t.search && status === 'ALL' && priority === 'ALL';

  return (
    <PageTransition>
      <PageHeader eyebrow="Operación" title="Soporte" description="Tickets de soporte de las empresas clientes." />
      <DataTable
        columns={columns}
        page={page}
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
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por ticket, asunto o empresa" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Actualizando…</span>}
              <FilterSelect value={priority} onChange={(v) => { setPriority(v); t.resetPage(); }} options={TICKET_PRIORITIES} allLabel="Todas las prioridades" ariaLabel="Filtrar por prioridad" />
              <FilterSelect value={status} onChange={(v) => { setStatus(v); t.resetPage(); }} options={TICKET_STATUSES} allLabel="Todos los estados" ariaLabel="Filtrar por estado" />
            </div>
          </div>
        }
        empty={noFilters ? <EmptyState compact icon={LifeBuoy} title="No hay tickets de soporte" description="Cuando una empresa solicite ayuda verás el ticket aquí." /> : undefined}
      />
      <TicketSheet ticket={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </PageTransition>
  );
}
