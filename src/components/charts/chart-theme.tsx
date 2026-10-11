import type { TooltipProps } from 'recharts';

export const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const axisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: 'hsl(var(--border))',
  strokeDasharray: '3 3',
  vertical: false,
} as const;

type ValueFormatter = (value: number) => string;

/** Tooltip que respeta el tema claro/oscuro. */
export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: TooltipProps<number, string> & { formatter?: ValueFormatter; labelFormatter?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-elevated">
      {label !== undefined && <p className="mb-1 font-medium">{labelFormatter ? labelFormatter(String(label)) : label}</p>}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{formatter ? formatter(Number(p.value)) : p.value}</span>
        </div>
      ))}
    </div>
  );
}
