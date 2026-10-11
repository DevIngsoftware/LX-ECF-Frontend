import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, BarChart3, Percent } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip, axisProps, gridProps } from '@/components/charts/chart-theme';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { formatNumber } from '@/utils/format';
import { DocHeader } from '../components/doc-ui';

const shortDate = (d: string) => new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short' }).format(new Date(d));

export function UsageSection() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.apiUsage, queryFn: () => developersService.usage() });
  const points = data ?? [];
  const total = points.reduce((s, p) => s + p.requests, 0);
  const errors = points.reduce((s, p) => s + p.errors, 0);
  const avg = points.length ? Math.round(total / points.length) : 0;
  const errorRate = total ? (errors / total) * 100 : 0;

  return (
    <>
      <DocHeader eyebrow="Mi cuenta" title="Consumo" description="Volumen de solicitudes y errores de tus credenciales en el período reciente." />

      {error ? (
        <div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard index={0} label="Solicitudes" value={formatNumber(total)} icon={Activity} tone="brand" loading={isLoading} hint={`Últimos ${points.length || '—'} días`} />
            <StatCard index={1} label="Promedio diario" value={formatNumber(avg)} icon={BarChart3} tone="info" loading={isLoading} />
            <StatCard index={2} label="Errores" value={formatNumber(errors)} icon={AlertTriangle} tone="danger" loading={isLoading} />
            <StatCard index={3} label="Tasa de error" value={`${errorRate.toFixed(1)}%`} icon={Percent} tone={errorRate > 5 ? 'warning' : 'success'} loading={isLoading} />
          </div>

          <section className="surface p-5" aria-labelledby="usage-chart">
            <div className="mb-4">
              <h2 id="usage-chart" className="font-semibold">Solicitudes por día</h2>
              <p className="text-xs text-muted-foreground">Solicitudes totales y solicitudes con error.</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : !points.length ? (
              <EmptyState compact icon={Activity} title="Sin consumo registrado" description="Cuando tus sistemas usen la API verás aquí la actividad." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usage-req" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} minTickGap={16} />
                    <YAxis {...axisProps} width={44} />
                    <Tooltip content={<ChartTooltip formatter={formatNumber} labelFormatter={shortDate} />} />
                    <Area type="monotone" dataKey="requests" name="Solicitudes" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#usage-req)" />
                    <Area type="monotone" dataKey="errors" name="Errores" stroke="hsl(var(--chart-5))" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
