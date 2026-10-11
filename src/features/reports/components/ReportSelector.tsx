import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { ReportKey } from '@/types/business';
import { cn } from '@/lib/utils';
import { REPORTS } from './report-meta';

interface ReportSelectorProps {
  value: ReportKey;
  onChange: (key: ReportKey) => void;
  isLocked: (key: ReportKey) => boolean;
}

export function ReportSelector({ value, onChange, isLocked }: ReportSelectorProps) {
  return (
    <div role="tablist" aria-label="Tipo de reporte" className="scrollbar-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {REPORTS.map((r) => {
        const active = r.key === value;
        const locked = isLocked(r.key);
        const Icon = r.icon;
        return (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.key)}
            className={cn(
              'relative flex min-w-[200px] items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-foreground/20 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0',
              active && 'border-brand/50 shadow-card',
            )}
          >
            {active && <motion.span layoutId="report-active" className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand text-white' : 'bg-muted text-muted-foreground')}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {r.title}
                {locked && <Lock className="h-3 w-3 text-muted-foreground" aria-label="Módulo no contratado" />}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{r.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
