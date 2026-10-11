import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Receipt, ReceiptText, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/states';
import { DataTable } from '@/components/tables/DataTable';
import { DateRangeFilter } from '@/components/forms/DateRangeFilter';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/features/auth/auth-context';
import { useTableQuery } from '@/hooks/use-table-query';
import { expensesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { Expense } from '@/types/business';
import type { DatePreset, DateRange } from '@/types/common';
import { rangeFromPreset } from '@/utils/dates';
import { formatDate, formatMoney, formatNumber } from '@/utils/format';
import { CategoryChart, type CategoryTotal } from '../components/CategoryChart';
import { ExpenseFormDialog } from '../components/ExpenseFormDialog';

export function ExpensesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('expenses.write');
  const t = useTableQuery({ sort: [{ id: 'date', desc: true }] });
  const [preset, setPreset] = useState<DatePreset>('year');
  const [range, setRange] = useState<DateRange>(() => rangeFromPreset('year'));
  const [category, setCategory] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);

  const categories = useQuery({ queryKey: queryKeys.expenseCategories, queryFn: () => expensesService.categories(), staleTime: 10 * 60 * 1000 });

  const query = { ...t.query, category, from: range.from, to: range.to };
  const list = useQuery({ queryKey: queryKeys.expenses(query), queryFn: () => expensesService.list(query), placeholderData: keepPreviousData });

  const summaryQuery = { category, from: range.from, to: range.to };
  const summary = useQuery({ queryKey: queryKeys.expenses({ ...summaryQuery, scope: 'summary' }), queryFn: () => expensesService.summary(summaryQuery) });
  const stats = summary.data ?? { total: 0, itbis: 0, count: 0, byCategory: [] as CategoryTotal[] };

  const columns = useMemo<ColumnDef<Expense, unknown>[]>(
    () => [
      { id: 'date', accessorKey: 'date', header: 'Fecha', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span> },
      { id: 'description', accessorKey: 'description', header: 'Descripción', enableSorting: false, cell: ({ row }) => <span className="block max-w-[240px] truncate font-medium">{row.original.description}</span> },
      {
        id: 'supplierName',
        accessorKey: 'supplierName',
        header: 'Proveedor',
        cell: ({ row }) =>
          row.original.supplierName ? (
            <div className="min-w-0">
              <p className="max-w-[220px] truncate">{row.original.supplierName}</p>
              {row.original.supplierRnc && <p className="font-mono text-xs text-muted-foreground">{row.original.supplierRnc}</p>}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      { id: 'category', accessorKey: 'category', header: 'Categoría', cell: ({ row }) => <Badge variant="neutral">{row.original.category}</Badge> },
      { id: 'ncf', accessorKey: 'ncf', header: 'NCF', enableSorting: false, cell: ({ row }) => <span className="font-mono text-xs">{row.original.ncf ?? '—'}</span> },
      { id: 'itbis', accessorKey: 'itbis', header: 'ITBIS', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{formatMoney(row.original.itbis)}</span> },
      { id: 'amount', accessorKey: 'amount', header: 'Monto', cell: ({ row }) => <span className="font-semibold tabular-nums">{formatMoney(row.original.amount)}</span> },
    ],
    [],
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Módulo"
        title="Gastos"
        description="Registra y clasifica los gastos de tu empresa por período."
        actions={canWrite && <Button onClick={() => setFormOpen(true)} disabled={!categories.data}><Plus /> Registrar gasto</Button>}
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeFilter
          preset={preset}
          range={range}
          onChange={(p, r) => {
            setPreset(p);
            setRange(r);
            t.resetPage();
          }}
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); t.resetPage(); }}>
          <SelectTrigger className="h-10 w-full lg:w-56" aria-label="Filtrar por categoría"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las categorías</SelectItem>
            {(categories.data ?? []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
          <StatCard index={0} label="Total de gastos" value={formatMoney(stats.total)} icon={Wallet} tone="brand" loading={summary.isLoading} hint="Sin ITBIS" />
          <StatCard index={1} label="ITBIS en gastos" value={formatMoney(stats.itbis)} icon={ReceiptText} tone="info" loading={summary.isLoading} />
          <StatCard index={2} label="Registros" value={formatNumber(stats.count)} icon={Receipt} loading={summary.isLoading} />
        </div>
        <div className="lg:col-span-2">
          <CategoryChart data={stats.byCategory} loading={summary.isLoading} />
        </div>
      </div>

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
        toolbar={<SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por descripción, proveedor o NCF" />}
        empty={
          <EmptyState
            compact
            icon={Wallet}
            title="Sin gastos"
            description="No hay gastos registrados con los filtros seleccionados."
            action={canWrite && <Button size="sm" onClick={() => setFormOpen(true)} disabled={!categories.data}><Plus /> Registrar gasto</Button>}
          />
        }
      />

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} categories={categories.data ?? []} />
    </PageTransition>
  );
}
