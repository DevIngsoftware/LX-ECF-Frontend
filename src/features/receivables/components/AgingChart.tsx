import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip, axisProps, gridProps } from '@/components/charts/chart-theme';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatMoneyCompact } from '@/utils/format';
import type { AgingBucket } from './receivables-utils';

const BUCKET_COLORS = ['hsl(var(--chart-3))', 'hsl(var(--chart-5))', 'hsl(var(--warning))', 'hsl(var(--chart-1))', 'hsl(var(--brand-strong))'];

export function AgingChart({ data, loading }: { data: AgingBucket[]; loading?: boolean }) {
  return (
    <section className="surface p-5" aria-labelledby="aging-title">
      <div className="mb-4">
        <h2 id="aging-title" className="font-semibold">Antigüedad de saldos</h2>
        <p className="text-xs text-muted-foreground">Saldo pendiente agrupado por días de atraso.</p>
      </div>
      {loading ? (
        <Skeleton className="h-60 w-full" />
      ) : (
        <>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval={0} fontSize={11} />
                <YAxis {...axisProps} width={64} tickFormatter={(v: number) => formatMoneyCompact(v)} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} content={<ChartTooltip formatter={formatMoney} />} />
                <Bar dataKey="amount" name="Saldo" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {data.map((b, i) => <Cell key={b.key} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
            {data.map((b, i) => (
              <li key={b.key} className="rounded-lg bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: BUCKET_COLORS[i] }} aria-hidden />
                  {b.label}
                </div>
                <p className="mt-0.5 font-semibold tabular-nums">{formatMoneyCompact(b.amount)}</p>
                <p className="text-muted-foreground">{b.count} factura(s)</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
