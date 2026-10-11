import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip, CHART_COLORS } from '@/components/charts/chart-theme';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatMoneyCompact } from '@/utils/format';

export interface CategoryTotal {
  category: string;
  amount: number;
}

const colorAt = (i: number) => (i < CHART_COLORS.length ? CHART_COLORS[i] : `hsl(0 0% ${40 + ((i * 9) % 40)}%)`);

export function CategoryChart({ data, loading }: { data: CategoryTotal[]; loading?: boolean }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <section className="surface p-5" aria-labelledby="cat-chart-title">
      <h2 id="cat-chart-title" className="font-semibold">Gastos por categoría</h2>
      <p className="mb-4 text-xs text-muted-foreground">Distribución del período seleccionado.</p>
      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : data.length === 0 ? (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">Sin gastos en el período.</p>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="hsl(var(--card))">
                  {data.map((d, i) => <Cell key={d.category} fill={colorAt(i)} />)}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={formatMoney} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="font-display text-lg font-bold tabular-nums">{formatMoneyCompact(total)}</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {data.map((d, i) => (
              <li key={d.category} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorAt(i) }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{d.category}</span>
                <span className="tabular-nums text-muted-foreground">{total ? Math.round((d.amount / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
