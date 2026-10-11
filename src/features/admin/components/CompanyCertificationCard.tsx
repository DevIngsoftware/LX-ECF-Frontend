import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { certificationService } from '@/services/api/certification';
import { errorMessage } from '@/services/http/errors';
import { CERTIFICATION_STEPS } from '@/features/certification/certification-steps';
import type { CertificationStepStatus } from '@/types/certification';

const meta: Record<CertificationStepStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'neutral' },
  EJECUTADO: { label: 'Ejecutado', tone: 'info' },
  OBSERVADO: { label: 'Observado', tone: 'warning' },
  CONFIRMADO: { label: 'Confirmado', tone: 'success' },
};

export function CompanyCertificationCard({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(1);
  const [note, setNote] = useState('');
  const key = ['admin', 'company', companyId, 'certification'];
  const progress = useQuery({ queryKey: key, queryFn: () => certificationService.adminProgress(companyId) });
  const receptions = useQuery({ queryKey: [...key, 'receptions'],
    queryFn: () => certificationService.adminReceptions(companyId), enabled: selected === 9 || selected === 11 });
  const state = progress.data?.steps.find((step) => step.number === selected);
  useEffect(() => { setNote(state?.summary ?? ''); }, [selected, state?.summary]);
  const review = useMutation({
    mutationFn: (status: 'CONFIRMADO' | 'OBSERVADO') => certificationService.review(companyId, selected, status, note),
    onSuccess: (data) => {
      qc.setQueryData(key, data);
      toast.success('Etapa de certificación actualizada');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const previousConfirmed = selected === 1 || progress.data?.steps.some((step) => step.number === selected - 1 && step.status === 'CONFIRMADO');

  return <section className="surface space-y-4 p-5 lg:col-span-2" aria-labelledby="company-certification-title">
    <div><h2 id="company-certification-title" className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Certificación como emisor electrónico</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confirma únicamente las etapas verificadas con evidencia. Las pruebas ejecutadas por la API no equivalen a aprobación de la DGII.</p></div>
    {progress.isLoading ? <LoadingState rows={4} /> : progress.error ? <ErrorState error={progress.error} onRetry={() => void progress.refetch()} /> : <>
      <p className="text-sm"><strong>Ambiente activo:</strong> {progress.data?.environment}</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
        <ol className="max-h-96 space-y-1 overflow-y-auto">{CERTIFICATION_STEPS.map((title, index) => {
          const number = index + 1;
          const step = progress.data?.steps.find((item) => item.number === number);
          const status = step?.status ?? 'PENDIENTE';
          return <li key={number}><button type="button" onClick={() => setSelected(number)} className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm ${selected === number ? 'border-brand bg-brand-soft/30' : 'hover:bg-muted/40'}`}>
            <span>{number}. {title}</span><StatusBadge {...meta[status]} />
          </button></li>;
        })}</ol>
        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="font-semibold">{selected}. {CERTIFICATION_STEPS[selected - 1]}</h3>
          <p className="text-sm text-muted-foreground">Estado: {meta[state?.status ?? 'PENDIENTE'].label}</p>
          {state?.summary && <p className="rounded-lg border bg-muted/30 p-2 text-sm">{state.summary}</p>}
          {state?.result != null && <details className="rounded-lg border p-2 text-xs"><summary className="cursor-pointer font-medium">Resultado registrado por la API</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(state.result, null, 2)}</pre></details>}
          {(selected === 9 || selected === 11) && <div className="rounded-lg border p-2 text-xs">
            <p className="font-medium">Recepciones desde el inicio de la prueba: {selected === 9 ? receptions.data?.ecf.length ?? 0 : receptions.data?.approvals.length ?? 0}</p>
            {receptions.error && <p className="text-destructive">{errorMessage(receptions.error)}</p>}
            <ul className="mt-1 max-h-32 overflow-y-auto">{(selected === 9 ? receptions.data?.ecf : receptions.data?.approvals)?.map((item, index) => <li key={`${item.encf}-${index}`}>{item.encf} · {item.receivedAt}</li>)}</ul>
          </div>}
          <div className="space-y-2"><Label htmlFor="cert-review-note">Nota o evidencia verificada</Label><Textarea id="cert-review-note" rows={5} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Indica qué se verificó y dónde consta la aprobación" /></div>
          {!previousConfirmed && <p className="text-xs text-warning">Confirma el paso anterior antes de avanzar.</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!note.trim() || !previousConfirmed || review.isPending} onClick={() => review.mutate('CONFIRMADO')}>{review.isPending && <Loader2 className="animate-spin" />} Confirmar etapa</Button>
            <Button type="button" variant="outline" disabled={!note.trim() || review.isPending} onClick={() => review.mutate('OBSERVADO')}>Registrar observación</Button>
          </div>
        </div>
      </div>
    </>}
  </section>;
}
