import { motion } from 'framer-motion';
import { Check, Clock, ListChecks, Send, Zap } from 'lucide-react';
import { staggerItem } from '@/components/animations/motion';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import type { ModuleInfo } from '@/types/account';
import { cn } from '@/lib/utils';
import { MODULE_ICONS, MODULE_STATUS_META, type ModuleViewStatus } from './module-meta';

interface ModuleCardProps {
  module: ModuleInfo;
  status: ModuleViewStatus;
  canManage: boolean;
  onAction: (m: ModuleInfo, kind: 'activate' | 'request') => void;
}

export function ModuleCard({ module: m, status, canManage, onAction }: ModuleCardProps) {
  const Icon = MODULE_ICONS[m.key] ?? Zap;
  const meta = MODULE_STATUS_META[status];
  const active = status === 'active';

  return (
    <motion.article variants={staggerItem} className={cn('surface surface-hover flex h-full flex-col p-5', active && 'ring-1 ring-success/20')}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand text-white' : 'bg-brand-soft text-brand')}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>

      <h3 className="mt-4 text-base font-semibold">{m.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>

      {m.benefits.length > 0 && (
        <ul className="mt-4 space-y-2">
          {m.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {m.requirements.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed bg-muted/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" aria-hidden /> Requisitos
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {m.requirements.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}

      <div className="min-h-5 flex-1" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="text-xs text-muted-foreground">{m.availability}</span>
        {status === 'active' && <span className="flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> En uso</span>}
        {status === 'requested' && <span className="flex items-center gap-1 text-xs font-medium text-warning"><Clock className="h-3.5 w-3.5" /> En revisión por LX</span>}
        {status === 'soon' && <span className="text-xs font-medium text-muted-foreground">Disponible pronto</span>}
        {status === 'available' && (
          <Button size="sm" onClick={() => onAction(m, 'activate')} disabled={!canManage}>
            <Zap /> Activar
          </Button>
        )}
        {status === 'requires_plan' && (
          <Button size="sm" variant="outline" onClick={() => onAction(m, 'request')} disabled={!canManage}>
            <Send /> Solicitar
          </Button>
        )}
      </div>
    </motion.article>
  );
}
