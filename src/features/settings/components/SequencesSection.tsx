import { Link } from 'react-router-dom';
import { ArrowRight, Hash } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import { ROUTES } from '@/constants/routes';
import type { Sequence } from '@/types/ecf';
import { daysUntil, formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { SectionError, SectionLoading, SectionShell, useDgiiOverview } from './settings-shared';

/** Extrae la parte numérica de un e-NCF (p. ej. E310000000001 -> 1). */
const seqNumber = (encf: string) => {
  const n = Number(encf.replace(/^[A-Z]\d{2}/i, ''));
  return Number.isFinite(n) ? n : null;
};

function stats(s: Sequence) {
  const from = seqNumber(s.rangeFrom);
  const to = seqNumber(s.rangeTo);
  const total = from !== null && to !== null && to >= from ? to - from + 1 : null;
  const used = total !== null ? Math.max(0, total - s.remaining) : null;
  const pct = total ? Math.round(((used ?? 0) / total) * 100) : 0;
  const expDays = s.expiresAt ? daysUntil(s.expiresAt) : null;
  const low = total ? s.remaining / total < 0.1 : s.remaining < 100;
  const tone = s.remaining <= 0 || (expDays !== null && expDays <= 0) ? 'danger' : low || (expDays !== null && expDays <= 30) ? 'warning' : 'success';
  return { total, used, pct, expDays, tone } as const;
}

const BAR = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive' } as const;
const LABEL = { success: 'Vigente', warning: 'Por agotarse o vencer', danger: 'Agotada o vencida' } as const;

export function SequencesSection() {
  const { data, isLoading, error, refetch } = useDgiiOverview();
  const sequences = data?.sequences ?? [];

  return (
    <SectionShell
      title="Secuencias electrónicas"
      description="Rangos de e-NCF autorizados por la DGII para cada tipo de comprobante."
      actions={<Button asChild variant="outline" size="sm"><Link to={ROUTES.app.dgii}>Gestionar en Centro DGII <ArrowRight /></Link></Button>}
    >
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : sequences.length === 0 ? (
        <EmptyState compact icon={Hash} title="Sin secuencias registradas" description="Solicita tus secuencias en la Oficina Virtual de la DGII y regístralas para poder emitir." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {sequences.map((s) => {
            const st = stats(s);
            return (
              <li key={s.type} className="rounded-xl border bg-background/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{s.type}</p>
                    <p className="text-xs text-muted-foreground">{ECF_TYPE_MAP[s.type]?.name ?? s.type}</p>
                  </div>
                  <StatusBadge label={LABEL[st.tone]} tone={st.tone} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={st.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Uso de la secuencia ${s.type}`}>
                  <div className={cn('h-full rounded-full transition-all duration-700', BAR[st.tone])} style={{ width: `${st.pct}%` }} />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Usados</dt><dd className="font-semibold tabular-nums">{st.used !== null ? formatNumber(st.used) : '—'}</dd></div>
                  <div><dt className="text-muted-foreground">Disponibles</dt><dd className="font-semibold tabular-nums">{formatNumber(s.remaining)}</dd></div>
                  <div>
                    <dt className="text-muted-foreground">Vence</dt>
                    <dd className={cn('font-semibold', st.expDays !== null && st.expDays <= 30 && 'text-warning')}>{formatDate(s.expiresAt)}</dd>
                  </div>
                </dl>
                <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">
                  {s.rangeFrom} – {s.rangeTo} · actual {s.current}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}
