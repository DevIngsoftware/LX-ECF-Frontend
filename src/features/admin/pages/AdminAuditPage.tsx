import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { History } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { useTableQuery } from '@/hooks/use-table-query';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { AuditEvent } from '@/types/platform';
import { formatDateTime } from '@/utils/format';
import { FilterSelect } from '../components/FilterSelect';

const categories = [{ value: 'ACCESO', label: 'Acceso' }, { value: 'CAMBIO', label: 'Cambios' }, { value: 'EVENTO', label: 'Eventos' }];

export function AdminAuditPage() {
  const table = useTableQuery({ sort: [{ id: 'at', desc: true }] });
  const [category, setCategory] = useState('ALL');
  const query = { ...table.query, category: category === 'ALL' ? undefined : category };
  const list = useQuery({ queryKey: queryKeys.admin.audit(query), queryFn: () => adminService.audit(query), placeholderData: keepPreviousData });
  const columns = useMemo<ColumnDef<AuditEvent, unknown>[]>(() => [
    { id: 'at', accessorKey: 'at', header: 'Fecha', cell: ({ row }) => <span className="whitespace-nowrap text-sm">{formatDateTime(row.original.at)}</span> },
    { id: 'actor', accessorKey: 'actor', header: 'Usuario', cell: ({ row }) => <span className="font-medium">{row.original.actor}</span> },
    { id: 'action', accessorKey: 'action', header: 'Acción' },
    { id: 'target', accessorKey: 'target', header: 'Recurso' },
    { id: 'category', header: 'Categoría', enableSorting: false, cell: ({ row }) => <GenericStatusBadge status={row.original.category} /> },
    { id: 'ip', header: 'IP', enableSorting: false, cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.ip ?? '—'}</span> },
  ], []);

  return <PageTransition>
    <PageHeader eyebrow="Administración" title="Auditoría" description="Registro de actividad de la plataforma." />
    <DataTable columns={columns} page={list.data} isLoading={list.isLoading} error={list.error} onRetry={() => void list.refetch()}
      pageIndex={table.pageIndex} onPageChange={table.setPageIndex} sorting={table.sorting} onSortingChange={table.setSorting} getRowId={(row) => row.id}
      toolbar={<div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-between"><SearchInput value={table.search} onChange={table.setSearch} placeholder="Buscar usuario, acción o recurso" /><FilterSelect value={category} onChange={(value) => { setCategory(value); table.resetPage(); }} options={categories} allLabel="Todas las categorías" ariaLabel="Filtrar por categoría" /></div>}
      empty={<EmptyState compact icon={History} title="Sin eventos" description="La actividad registrada aparecerá aquí." />} />
  </PageTransition>;
}
