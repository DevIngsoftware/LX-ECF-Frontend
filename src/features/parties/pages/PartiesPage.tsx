import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Plus, Power, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/states';
import { PageTransition } from '@/components/animations/motion';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-context';
import { useTableQuery } from '@/hooks/use-table-query';
import { partiesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { Party, PartyKind } from '@/types/business';
import { formatMoney, initials } from '@/utils/format';
import { PARTY_META, formatRnc } from '../components/party-meta';
import { PartyFormSheet } from '../components/PartyFormSheet';
import { PartyActiveConfirm } from '../components/PartyActiveConfirm';
import { PartyStatusBadge } from '../components/PartyStatusBadge';

type ActiveFilter = 'all' | 'active' | 'inactive';

export function PartiesPage({ kind }: { kind: PartyKind }) {
  const meta = PARTY_META[kind];
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('parties.write');
  const t = useTableQuery({ sort: [{ id: 'legalName', desc: false }] });
  const [active, setActive] = useState<ActiveFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [toggling, setToggling] = useState<Party | null>(null);

  const query = { ...t.query, active };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.parties(kind, query),
    queryFn: () => partiesService.list(kind, query),
    placeholderData: keepPreviousData,
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Party, unknown>[]>(() => {
    const cols: ColumnDef<Party, unknown>[] = [
      {
        id: 'legalName',
        accessorKey: 'legalName',
        header: 'Nombre / razón social',
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
              {initials(row.original.tradeName ?? row.original.legalName)}
            </span>
            <div className="min-w-0">
              <p className="max-w-[260px] truncate font-medium">{row.original.legalName}</p>
              {row.original.tradeName && <p className="max-w-[260px] truncate text-xs text-muted-foreground">{row.original.tradeName}</p>}
            </div>
          </div>
        ),
      },
      {
        id: 'rnc',
        accessorKey: 'rnc',
        header: 'RNC / Cédula',
        cell: ({ row }) => <span className="font-mono text-xs">{formatRnc(row.original.rnc)}</span>,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Correo',
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email ?? '—'}</span>,
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: 'Teléfono',
        enableSorting: false,
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.phone ?? '—'}</span>,
      },
      {
        id: 'totalAmount',
        accessorKey: 'totalAmount',
        header: meta.totalLabel,
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.totalAmount ?? 0)}</span>,
      },
      {
        id: 'active',
        accessorKey: 'active',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => <PartyStatusBadge active={row.original.active} />,
      },
    ];
    if (canWrite) {
      cols.push({
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${row.original.legalName}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setToggling(row.original)} className={row.original.active ? 'text-destructive focus:text-destructive' : undefined}>
                  <Power className="mr-2 h-4 w-4" /> {row.original.active ? 'Desactivar' : 'Reactivar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      });
    }
    return cols;
  }, [canWrite, meta.totalLabel]);

  const noFilters = !t.search && active === 'all';

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Terceros"
        title={meta.title}
        description={meta.description}
        actions={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus /> Nuevo {meta.singular}
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
        getRowId={(r) => r.id}
        onRowClick={(r) => navigate(meta.detailRoute(r.id))}
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por nombre, RNC o correo" />
            <div className="flex items-center gap-2">
              {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Actualizando…</span>}
              <Select
                value={active}
                onValueChange={(v) => {
                  setActive(v as ActiveFilter);
                  t.resetPage();
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filtrar por estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        empty={
          noFilters ? (
            <EmptyState
              compact
              icon={Users}
              title={`Aún no tienes ${meta.title.toLowerCase()}`}
              description={`Registra tu primer ${meta.singular} para agilizar tus operaciones.`}
              action={canWrite && <Button size="sm" onClick={openCreate}><Plus /> Nuevo {meta.singular}</Button>}
            />
          ) : undefined
        }
      />

      <PartyFormSheet kind={kind} open={formOpen} onOpenChange={setFormOpen} party={editing} />
      <PartyActiveConfirm kind={kind} party={toggling} onOpenChange={(o) => !o && setToggling(null)} />
    </PageTransition>
  );
}
