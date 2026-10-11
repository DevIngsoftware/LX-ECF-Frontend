import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { useTableQuery } from '@/hooks/use-table-query';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { AdminCompany } from '@/types/platform';
import { formatDate, formatNumber, initials } from '@/utils/format';
import { COMPANY_STATUSES } from '../components/admin-meta';
import { FilterSelect } from '../components/FilterSelect';

export function AdminCompaniesPage() {
  const navigate = useNavigate();
  const t = useTableQuery({ sort: [{ id: 'name', desc: false }] });
  const [status, setStatus] = useState('ALL');
  const query = { ...t.query, status: status === 'ALL' ? undefined : status };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.admin.companies(query),
    queryFn: () => adminService.companies(query),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<ColumnDef<AdminCompany, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Empresa',
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">{initials(row.original.name)}</span>
            <div className="min-w-0">
              <p className="max-w-[240px] truncate font-medium">{row.original.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.original.rnc}</p>
            </div>
          </div>
        ),
      },
      { id: 'plan', accessorKey: 'plan', header: 'Plan', cell: ({ row }) => <Badge variant="outline">{row.original.plan}</Badge> },
      { id: 'status', accessorKey: 'status', header: 'Estado', enableSorting: false, cell: ({ row }) => <GenericStatusBadge status={row.original.status} /> },
      {
        id: 'documentsThisMonth',
        accessorKey: 'documentsThisMonth',
        header: 'Docs. del mes',
        cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.documentsThisMonth)}</span>,
      },
      { id: 'users', accessorKey: 'users', header: 'Usuarios', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatNumber(row.original.users)}</span> },
      { id: 'createdAt', accessorKey: 'createdAt', header: 'Alta', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
    ],
    [],
  );

  return (
    <PageTransition>
      <PageHeader eyebrow="Administración" title="Empresas" description="Empresas registradas en la plataforma, su plan y su actividad." />
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
        onRowClick={(r) => navigate(ROUTES.admin.company(r.id))}
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por nombre, RNC o plan" />
            <div className="flex items-center gap-2">
              {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Actualizando…</span>}
              <FilterSelect
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  t.resetPage();
                }}
                options={COMPANY_STATUSES}
                allLabel="Todos los estados"
                ariaLabel="Filtrar por estado"
              />
            </div>
          </div>
        }
        empty={!t.search && status === 'ALL' ? <EmptyState compact icon={Building2} title="Aún no hay empresas registradas" /> : undefined}
      />
    </PageTransition>
  );
}
