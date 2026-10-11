import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { ReportData, ReportKey } from '@/types/business';
import type { DateRange } from '@/types/common';
import { formatMoney, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { REPORT_MAP, humanizeValue, isCountColumn } from './report-meta';
import { ReportChart } from './ReportChart';

function formatCell(key: ReportKey, column: ReportData['columns'][number], value: string | number | undefined) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'number') return column.numeric && !isCountColumn(column.key) ? formatMoney(value) : formatNumber(value);
  return humanizeValue(key, column.key, value);
}

export function ReportView({ reportKey, range }: { reportKey: ReportKey; range: DateRange }) {
  const meta = REPORT_MAP[reportKey];
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.report(reportKey, range),
    queryFn: () => reportsService.get(reportKey, range),
  });

  const chartData = useMemo(() => (data?.chart ?? []).map((c) => ({ label: humanizeValue(reportKey, 'label', c.label), value: c.value })), [data, reportKey]);
  const totals = useMemo(() => {
    if (!data) return null;
    const numeric = data.columns.filter((c) => c.numeric);
    if (!numeric.length || data.rows.length < 2) return null;
    return Object.fromEntries(numeric.map((c) => [c.key, data.rows.reduce((s, r) => s + (typeof r[c.key] === 'number' ? (r[c.key] as number) : 0), 0)]));
  }, [data]);

  if (error) return <div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div>;

  return (
    <div className={cn('space-y-6 transition-opacity', isFetching && !isLoading && 'opacity-70')}>
      <section className="surface p-5" aria-labelledby="report-chart-title">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><meta.icon className="h-4 w-4" aria-hidden /></span>
          <div>
            <h2 id="report-chart-title" className="font-semibold">{meta.title}</h2>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState compact icon={BarChart3} title="Sin datos en el período" description="Ajusta el rango de fechas para ver información." />
        ) : (
          <ReportChart kind={meta.chart} format={meta.valueFormat} data={chartData} />
        )}
      </section>

      <section className="surface overflow-hidden" aria-label="Resumen">
        <div className="border-b px-5 py-4">
          <h3 className="font-semibold">Resumen</h3>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : !data || data.rows.length === 0 ? (
          <EmptyState compact title="Sin registros" description="No hay datos para el período seleccionado." />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {data.columns.map((c) => (
                    <th key={c.key} scope="col" className={cn('h-10 whitespace-nowrap px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground', c.numeric ? 'text-right' : 'text-left')}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-t transition-colors hover:bg-muted/40">
                    {data.columns.map((c, ci) => (
                      <td key={c.key} className={cn('whitespace-nowrap px-5 py-3', c.numeric ? 'text-right tabular-nums' : 'text-left', ci === 0 && 'font-medium', c.key === 'rnc' && 'font-mono text-xs')}>
                        {formatCell(reportKey, c, row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="border-t-2 bg-muted/30 font-semibold">
                    {data.columns.map((c, ci) => (
                      <td key={c.key} className={cn('whitespace-nowrap px-5 py-3', c.numeric ? 'text-right tabular-nums' : 'text-left')}>
                        {ci === 0 ? 'Total' : c.numeric ? formatCell(reportKey, c, totals[c.key]) : ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
