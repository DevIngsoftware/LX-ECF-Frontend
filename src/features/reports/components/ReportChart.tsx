import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartTooltip, CHART_COLORS, axisProps, gridProps } from '@/components/charts/chart-theme';
import { formatMoney, formatMoneyCompact, formatNumber } from '@/utils/format';
import type { ReportChartKind, ReportValueFormat } from './report-meta';

interface ReportChartProps {
  kind: ReportChartKind;
  format: ReportValueFormat;
  data: { label: string; value: number }[];
}

const colorAt = (i: number) => (i < CHART_COLORS.length ? CHART_COLORS[i] : `hsl(0 0% ${40 + ((i * 9) % 40)}%)`);

export function ReportChart({ kind, format, data }: ReportChartProps) {
  const fmt = format === 'money' ? formatMoney : formatNumber;
  const tick = format === 'money' ? (v: number) => formatMoneyCompact(v) : (v: number) => formatNumber(v);
  const tooltip = <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} content={<ChartTooltip formatter={fmt} />} />;

  if (kind === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="90%" paddingAngle={2} stroke="hsl(var(--card))">
                {data.map((d, i) => <Cell key={d.label} fill={colorAt(i)} />)}
              </Pie>
              {tooltip}
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-2.5 text-sm">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorAt(i) }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{d.label}</span>
              <span className="font-medium tabular-nums">{fmt(d.value)}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (kind === 'hbar') {
    return (
      <div style={{ height: Math.max(180, data.length * 44) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={tick} />
            <YAxis type="category" dataKey="label" {...axisProps} width={150} tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
            {tooltip}
            <Bar dataKey="value" name="Valor" fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (kind === 'area') {
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="report-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={70} tickFormatter={tick} />
            {tooltip}
            <Area type="monotone" dataKey="value" name="Total" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#report-area)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} width={70} tickFormatter={tick} />
          {tooltip}
          <Bar dataKey="value" name="Total" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
