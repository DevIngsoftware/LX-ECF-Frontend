import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatusTone } from '@/constants/ecf';
import { cn } from '@/lib/utils';

const iconTone: Record<StatusTone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-foreground',
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: StatusTone;
  hint?: ReactNode;
  loading?: boolean;
  index?: number;
}

export function StatCard({ label, value, icon: Icon, tone = 'neutral', hint, loading, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="surface surface-hover p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconTone[tone])}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-32" />
      ) : (
        <p className="mt-2 font-display text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      )}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}
