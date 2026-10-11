import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, CircleDollarSign, HandCoins, Info, TrendingUp } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ErrorState } from '@/components/shared/states';
import { PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_STATUS_META } from '@/constants/ecf';
import { useAuth } from '@/features/auth/auth-context';
import { useTableQuery } from '@/hooks/use-table-query';
import { receivablesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { Receivable } from '@/types/business';
import { formatDate, formatMoney, formatNumber } from '@/utils/format';
import { AgingChart } from '../components/AgingChart';
import { FiscalStatusCell } from '../components/FiscalStatus';
import { PaymentDialog } from '../components/PaymentDialog';
import { ReceivableSheet } from '../components/ReceivableSheet';
import { computeAging, daysOverdue, summarize } from '../components/receivables-utils';

const SUMMARY_QUERY = { page: 0, size: 1000, scope: 'summary' } as const;

export function ReceivablesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('receivables.write');
  const canViewInvoice = hasPermission('invoices.read');
  const t = useTableQuery({ sort: [{ id: 'dueDate', desc: false }] });
  const [status, setStatus] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Receivable | null>(null);

  const query = { ...t.query, status };
  const list = useQuery({
    queryKey: queryKeys.receivables(query),
    queryFn: () => receivablesService.list(query),
    placeholderData: keepPreviousData,
  });
  const all = useQuery({
    queryKey: queryKeys.receivables(SUMMARY_QUERY),
    queryFn: () => receivablesService.list({ page: 0, size: 1000 }),
  });
  const payments = useQuery({ queryKey: queryKeys.payments, queryFn: () => receivablesService.payments() });

  const allItems = useMemo(() => all.data?.content ?? [], [all.data]);
  const summary = useMemo(() => summarize(allItems, payments.data ?? []), [allItems, payments.data]);
  const aging = useMemo(() => computeAging(allItems), [allItems]);
  const selected = selectedId ? list.data?.content.find((r) => r.id === selectedId) ?? allItems.find((r) => r.id === selectedId) ?? null : null;

  const columns = useMemo<ColumnDef<Receivable, unknown>[]>(() => {
    const cols: ColumnDef<Receivable, unknown>[] = [
      { id: 'encf', accessorKey: 'encf', header: 'e-NCF', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.encf}</span> },
      { id: 'customerName', accessorKey: 'customerName', header: 'Cliente', cell: ({ row }) => <span className="block max-w-[220px] truncate font-medium">{row.original.customerName}</span> },
      { id: 'issueDate', accessorKey: 'issueDate', header: 'Emisión', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
      {
        id: 'dueDate',
        accessorKey: 'dueDate',
        header: 'Vencimiento',
        cell: ({ row }) => {
          const d = daysOverdue(row.original.dueDate);
          const late = d > 0 && row.original.balance > 0;
          return (
            <div>
              <p className={late ? 'font-medium text-destructive' : 'text-muted-foreground'}>{formatDate(row.original.dueDate)}</p>
              {late && <p className="text-xs text-destructive">{d} día(s) de atraso</p>}
            </div>
          );
        },
      },
      { id: 'total', accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatMoney(row.original.total)}</span> },
      { id: 'balance', accessorKey: 'balance', header: 'Saldo', cell: ({ row }) => <span className="font-semibold tabular-nums">{formatMoney(row.original.balance)}</span> },
      { id: 'fiscal', header: 'Estado DGII', enableSorting: false, cell: ({ row }) => <FiscalStatusCell invoiceId={row.original.invoiceId} /> },
      { id: 'status', header: 'Estado de pago', enableSorting: false, cell: ({ row }) => <PaymentStatusBadge status={row.original.status} /> },
    ];
    if (canWrite) {
      cols.push({
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.balance > 0 ? (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" onClick={() => setPaying(row.original)}><HandCoins /> Registrar cobro</Button>
            </div>
          ) : null,
      });
    }
    return cols;
  }, [canWrite]);

  return (
    <PageTransition>
      <PageHeader eyebrow="Módulo" title="Cuentas por cobrar" description="Saldos, vencimientos y cobros de tus facturas a crédito." />

      <div className="mb-6 flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>El <strong className="text-foreground">estado fiscal</strong> (DGII) y el <strong className="text-foreground">estado de pago</strong> son independientes. Los cobros se registran manualmente: esta plataforma no procesa pagos.</p>
      </div>

      {all.error ? (
        <div className="surface mb-6"><ErrorState compact error={all.error} onRetry={() => void all.refetch()} /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard index={0} label="Por cobrar" value={formatMoney(summary.outstanding)} icon={CircleDollarSign} tone="brand" loading={all.isLoading} hint={`${formatNumber(summary.openCount)} factura(s) con saldo`} />
            <StatCard index={1} label="Vencido" value={formatMoney(summary.overdue)} icon={AlertTriangle} tone="danger" loading={all.isLoading} hint={`${formatNumber(summary.overdueCount)} factura(s) vencida(s)`} />
            <StatCard index={2} label="Cobrado este mes" value={formatMoney(summary.collectedMonth)} icon={TrendingUp} tone="success" loading={all.isLoading || payments.isLoading} hint="Según cobros registrados" />
          </div>
          <div className="mb-6">
            <AgingChart data={aging} loading={all.isLoading} />
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        page={list.data}
        isLoading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        pageIndex={t.pageIndex}
        onPageChange={t.setPageIndex}
        sorting={t.sorting}
        onSortingChange={t.setSorting}
        getRowId={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por e-NCF o cliente" />
            <Select value={status} onValueChange={(v) => { setStatus(v); t.resetPage(); }}>
              <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filtrar por estado de pago"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados de pago</SelectItem>
                {Object.entries(PAYMENT_STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ReceivableSheet
        receivable={selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        payments={payments.data}
        paymentsLoading={payments.isLoading}
        paymentsError={payments.error}
        onRetryPayments={() => void payments.refetch()}
        canWrite={canWrite}
        canViewInvoice={canViewInvoice}
        onRegisterPayment={setPaying}
      />
      <PaymentDialog receivable={paying} onOpenChange={(o) => !o && setPaying(null)} />
    </PageTransition>
  );
}
