import { motion } from 'framer-motion';
import { CheckCircle2, Circle, FileSignature, Send, XCircle, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';
import type { InvoiceEvent } from '@/types/ecf';
import { formatDateTime, formatRelative } from '@/utils/format';
import { cn } from '@/lib/utils';

const EVENT_META: Record<string, { icon: LucideIcon; tone: string; label: string }> = {
  CREADO: { icon: Circle, tone: 'bg-info-soft text-info', label: 'Creado' },
  FIRMADO: { icon: FileSignature, tone: 'bg-muted text-foreground', label: 'Firmado' },
  ENVIADO: { icon: Send, tone: 'bg-info-soft text-info', label: 'Enviado' },
  ACEPTADO: { icon: CheckCircle2, tone: 'bg-success-soft text-success', label: 'Aceptado DGII' },
  ACEPTADO_CONDICIONAL: { icon: CheckCircle2, tone: 'bg-warning-soft text-warning', label: 'Aceptado condicional' },
  RECHAZADO: { icon: XCircle, tone: 'bg-destructive-soft text-destructive', label: 'Rechazado DGII' },
};

const fallback = (type: string) => ({ icon: Circle, tone: 'bg-muted text-muted-foreground', label: type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ') });

export function EventTimeline({ events, emptyText = 'Aún no hay eventos registrados.' }: { events: InvoiceEvent[]; emptyText?: string }) {
  if (!events.length) return <EmptyState compact title="Sin eventos" description={emptyText} />;
  return (
    <ol className="relative space-y-1">
      {events.map((e, i) => {
        const meta = EVENT_META[e.type] ?? fallback(e.type);
        const Icon = meta.icon;
        const last = i === events.length - 1;
        return (
          <motion.li
            key={`${e.at}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="relative flex gap-3 pb-4"
          >
            {!last && <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-border" aria-hidden />}
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.tone)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium">{meta.label}</p>
                <time dateTime={e.at} className="text-xs text-muted-foreground" title={formatDateTime(e.at)}>
                  {formatRelative(e.at)}
                </time>
              </div>
              <p className="text-sm text-muted-foreground">{e.description}</p>
              {e.actor && <p className="mt-0.5 text-xs text-muted-foreground">Por {e.actor}</p>}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
