import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS, ChartTooltip, axisProps, gridProps } from '@/components/charts/chart-theme';
import { EmptyState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminDashboard, AdminDashboardOverview } from '@/types/platform';
import { formatNumber } from '@/utils/format';

const monthLabel = (d: string) => new Intl.DateTimeFormat('es-DO', { month: 'short', year: '2-digit' }).format(new Date(`${d.slice(0, 10)}T12:00:00`));

export function GrowthChart({ data, loading }: { data: AdminDashboardOverview['trend']; loading?: boolean }) {
  return (
    <section className="surface p-5" aria-labelledby="growth-title">
      <div className="mb-4">
        <h2 id="growth-title" className="font-semibold">Crecimiento de la plataforma</h2>
        <p className="text-xs text-muted-foreground">Comprobantes registrados por mes durante el último año.</p>
      </div>
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : !data.length ? (
        <EmptyState compact title="Sin datos de tendencia" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="admin-docs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" {...axisProps} tickFormatter={monthLabel} minTickGap={16} />
              <YAxis {...axisProps} width={52} tickFormatter={(v: number) => formatNumber(v)} />
              <Tooltip content={<ChartTooltip formatter={formatNumber} labelFormatter={monthLabel} />} />
              <Area type="monotone" dataKey="documents" name="Documentos" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#admin-docs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function PlanDistributionChart({ data, loading }: { data: AdminDashboard['planDistribution']; loading?: boolean }) {
  const total = data.reduce((s, d) => s + d.companies, 0);
  return (
    <section className="surface p-5" aria-labelledby="plans-title">
      <div className="mb-4">
        <h2 id="plans-title" className="font-semibold">Empresas por plan</h2>
        <p className="text-xs text-muted-foreground">{formatNumber(total)} empresa(s) en total.</p>
      </div>
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : !data.length ? (
        <EmptyState compact title="Sin planes" />
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" {...axisProps} allowDecimals={false} />
                <YAxis type="category" dataKey="plan" {...axisProps} width={96} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} content={<ChartTooltip formatter={formatNumber} />} />
                <Bar dataKey="companies" name="Empresas" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {data.map((d, i) => <Cell key={d.plan} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.map((d, i) => (
              <li key={d.plan} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden />
                <span className="text-muted-foreground">{d.plan}</span>
                <span className="ml-auto font-semibold tabular-nums">{formatNumber(d.companies)}</span>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{total ? Math.round((d.companies / total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
