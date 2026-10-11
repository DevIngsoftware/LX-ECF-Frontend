import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, Loader2, Pencil } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import type { Sequence } from '@/types/ecf';
import { daysUntil, formatDate, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { SectionError, SectionLoading, SectionShell, useDgiiOverview } from './settings-shared';
import { SequencesStep } from '@/features/onboarding/components/SequencesStep';
import { STEP_FORM_ID, type SequencesStepValues } from '@/features/onboarding/schemas';

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
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const sequences = data?.sequences ?? [];
  const save = useMutation({
    mutationFn: (values: SequencesStepValues) => settingsService.saveOnboardingStep(4, values),
    onSuccess: () => {
      setEditing(false);
      void qc.invalidateQueries({ queryKey: queryKeys.dgii });
      void qc.invalidateQueries({ queryKey: queryKeys.settingsStatus });
      void qc.invalidateQueries({ queryKey: queryKeys.onboarding });
      toast.success('Secuencias actualizadas');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const values: SequencesStepValues = { items: sequences.map((s) => ({
    type: s.type, from: String(seqNumber(s.rangeFrom) ?? ''), to: String(seqNumber(s.rangeTo) ?? ''), expiresAt: s.expiresAt?.slice(0, 10) ?? '',
  })) };
  const usedTypes = sequences.filter((s) => (seqNumber(s.current) ?? 0) >= (seqNumber(s.rangeFrom) ?? 0)).map((s) => s.type);

  return (
    <SectionShell
      title="Secuencias electrónicas"
      description="Rangos de e-NCF autorizados por la DGII para cada tipo de comprobante."
      actions={!editing && <Button type="button" variant="outline" size="sm" disabled={isLoading || !!error} onClick={() => setEditing(true)}><Pencil /> Agregar o actualizar</Button>}
    >
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : editing ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Conserva los rangos de otros tipos. Para renovar una secuencia usada, cambia su inicio y fin por el nuevo rango autorizado; los números ya consumidos quedan protegidos.</p>
          <SequencesStep defaultValues={values} onSubmit={(next) => save.mutate(next)} usedTypes={usedTypes} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setEditing(false)}>Cancelar</Button>
            <Button type="submit" form={STEP_FORM_ID} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Guardar secuencias</Button>
          </div>
        </div>
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
