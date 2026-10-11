import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, CreditCard, MoreHorizontal, Play, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableQuery } from '@/hooks/use-table-query';
import { adminService } from '@/services/api/platform';
import { useAuth } from '@/features/auth/auth-context';
import { errorMessage } from '@/services/http/errors';
import { queryKeys } from '@/services/api/query-keys';
import type { AdminSubscription } from '@/types/platform';
import { daysUntil, formatDate, formatMoney } from '@/utils/format';
import { SUBSCRIPTION_STATUSES } from '../components/admin-meta';
import { FilterSelect } from '../components/FilterSelect';

const actionsFor = (status: string) => [
  { key: 'ACTIVA', label: 'Reactivar', icon: Play, show: status === 'SUSPENDIDA' },
  { key: 'SUSPENDIDA', label: 'Suspender', icon: Ban, show: status === 'ACTIVA' || status === 'PRUEBA' },
  { key: 'CANCELADA', label: 'Cancelar', icon: XCircle, show: status !== 'CANCELADA' },
];

export function AdminSubscriptionsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('admin.plans.write');
  const t = useTableQuery({ sort: [{ id: 'renewalDate', desc: false }] });
  const [status, setStatus] = useState('ALL');
  const [changing, setChanging] = useState<{ subscription: AdminSubscription; status: string; label: string } | null>(null);
  const query = { ...t.query, status: status === 'ALL' ? undefined : status };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.admin.subscriptions(query),
    queryFn: () => adminService.subscriptions(query),
    placeholderData: keepPreviousData,
  });
  const changeStatus = useMutation({
    mutationFn: ({ subscription, status: next }: { subscription: AdminSubscription; status: string }) =>
      adminService.setSubscriptionStatus(subscription.id, next),
    onSuccess: () => {
      toast.success('Estado de suscripción actualizado');
      setChanging(null);
      void qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const columns = useMemo<ColumnDef<AdminSubscription, unknown>[]>(
    () => [
      { id: 'company', accessorKey: 'company', header: 'Empresa', cell: ({ row }) => <span className="block max-w-[240px] truncate font-medium">{row.original.company}</span> },
      { id: 'plan', accessorKey: 'plan', header: 'Plan', cell: ({ row }) => <Badge variant="outline">{row.original.plan}</Badge> },
      { id: 'status', header: 'Estado', enableSorting: false, cell: ({ row }) => <GenericStatusBadge status={row.original.status} /> },
      {
        id: 'renewalDate',
        accessorKey: 'renewalDate',
        header: 'Renovación',
        cell: ({ row }) => {
          const d = daysUntil(row.original.renewalDate);
          return (
            <div>
              <p>{formatDate(row.original.renewalDate)}</p>
              <p className={d < 0 ? 'text-xs text-destructive' : d <= 7 ? 'text-xs text-warning' : 'text-xs text-muted-foreground'}>
                {d < 0 ? `Vencida hace ${Math.abs(d)} día(s)` : `En ${d} día(s)`}
              </p>
            </div>
          );
        },
      },
      { id: 'lastPaymentAt', accessorKey: 'lastPaymentAt', header: 'Último pago', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.lastPaymentAt)}</span> },
      {
        id: 'amount',
        accessorKey: 'amount',
        header: 'Monto',
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.amount > 0 ? formatMoney(row.original.amount) : '—'}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => canEdit ? (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${row.original.company}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Cambiar estado</DropdownMenuLabel>
                {actionsFor(row.original.status).filter((a) => a.show).map((a) => (
                  <DropdownMenuItem key={a.key} onSelect={() => setChanging({ subscription: row.original, status: a.key, label: a.label })}>
                    <a.icon className="mr-2 h-4 w-4" /> {a.label}
                  </DropdownMenuItem>
                ))}
                {row.original.status === 'VENCIDA' && <><DropdownMenuSeparator /><p className="px-2 py-1.5 text-xs text-muted-foreground">Para renovar una suscripción vencida, la empresa debe realizar otra operación de prueba.</p></>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null,
      },
    ],
    [canEdit],
  );

  return (
    <PageTransition>
      <PageHeader eyebrow="Administración" title="Suscripciones" description="Estado, renovación y pagos de las suscripciones de cada empresa." />
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
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por empresa o plan" />
            <div className="flex items-center gap-2">
              {isFetching && !isLoading && <span className="text-xs text-muted-foreground">Actualizando…</span>}
              <FilterSelect value={status} onChange={(v) => { setStatus(v); t.resetPage(); }} options={SUBSCRIPTION_STATUSES} allLabel="Todos los estados" ariaLabel="Filtrar por estado" />
            </div>
          </div>
        }
        empty={!t.search && status === 'ALL' ? <EmptyState compact icon={CreditCard} title="Aún no hay suscripciones" /> : undefined}
      />
      <ConfirmDialog
        open={!!changing}
        onOpenChange={(open) => !open && !changeStatus.isPending && setChanging(null)}
        title={`${changing?.label ?? 'Cambiar'} suscripción`}
        description={changing ? `${changing.label} la suscripción de ${changing.subscription.company}. Este cambio afectará sus módulos incluidos; no cambia el estado fiscal de la empresa.` : ''}
        confirmLabel={changing?.label ?? 'Confirmar'}
        destructive={changing?.status !== 'ACTIVA'}
        loading={changeStatus.isPending}
        onConfirm={() => changing && changeStatus.mutate(changing)}
      />
    </PageTransition>
  );
}
