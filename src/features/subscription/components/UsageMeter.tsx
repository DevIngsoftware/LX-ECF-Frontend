import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { usageTone } from './subscription-utils';

const BAR: Record<string, string> = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive' };
const TEXT: Record<string, string> = { success: 'text-muted-foreground', warning: 'text-warning', danger: 'text-destructive' };

interface UsageMeterProps {
  label: string;
  icon: LucideIcon;
  used: number;
  limit: number | null;
  unit: string;
}

export function UsageMeter({ label, icon: Icon, used, limit, unit }: UsageMeterProps) {
  const reduce = useReducedMotion();
  const tone = usageTone(used, limit);
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const message =
    limit === null ? 'Sin límite en tu plan' : tone === 'danger' ? 'Estás cerca del límite de tu plan' : tone === 'warning' ? 'Has usado más del 75 %' : `${formatNumber(Math.max(0, limit - used))} ${unit} disponibles`;

  return (
    <div className="rounded-xl border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> {label}
        </span>
        <span className="text-sm tabular-nums">
          <strong>{formatNumber(used)}</strong>
          <span className="text-muted-foreground"> / {limit === null ? 'Ilimitado' : formatNumber(limit)}</span>
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit ?? undefined}
        aria-valuenow={used}
      >
        {limit !== null && (
          <motion.div
            className={cn('h-full rounded-full', BAR[tone])}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>
      <p className={cn('mt-2 text-xs', TEXT[tone])}>{message}</p>
    </div>
  );
}
