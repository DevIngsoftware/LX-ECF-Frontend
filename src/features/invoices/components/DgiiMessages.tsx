import { AlertTriangle, Info } from 'lucide-react';
import type { DgiiMessage } from '@/types/ecf';
import { cn } from '@/lib/utils';

/** Lista de mensajes de validación. Los mensajes con código DEMO se marcan como no oficiales. */
export function DgiiMessages({ messages, tone = 'danger', emptyText }: { messages: DgiiMessage[]; tone?: 'danger' | 'warning' | 'info'; emptyText?: string }) {
  if (!messages.length) return emptyText ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null;
  return (
    <ul className="space-y-2">
      {messages.map((m, i) => {
        const demo = m.code === 'DEMO' || m.code?.startsWith('DEMO');
        const t = demo ? 'info' : tone;
        const Icon = t === 'info' ? Info : AlertTriangle;
        return (
          <li
            key={`${m.code ?? 'msg'}-${i}`}
            className={cn(
              'flex gap-3 rounded-lg border p-3 text-sm',
              t === 'danger' && 'border-destructive/30 bg-destructive-soft',
              t === 'warning' && 'border-warning/30 bg-warning-soft',
              t === 'info' && 'border-info/30 bg-info-soft',
            )}
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t === 'danger' ? 'text-destructive' : t === 'warning' ? 'text-warning' : 'text-info')} aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-foreground">
                {m.code && <span className="mr-2 font-mono text-xs text-muted-foreground">{m.code}</span>}
                {m.message}
              </p>
              {m.explanation && <p className="text-muted-foreground">{m.explanation}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
