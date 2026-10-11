import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, FlaskConical, Info, Loader2, Rocket, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { cn } from '@/lib/utils';
import { SectionError, SectionLoading, SectionShell, useDgiiOverview } from './settings-shared';

const ENVIRONMENTS: { code: string; name: string; description: string; icon: LucideIcon }[] = [
  { code: 'TesteCF', name: 'Pruebas (TesteCF)', description: 'Ambiente de pruebas de la DGII. Los comprobantes no tienen validez fiscal.', icon: FlaskConical },
  { code: 'CerteCF', name: 'Certificación (CerteCF)', description: 'Proceso de certificación como emisor electrónico ante la DGII.', icon: ShieldCheck },
  { code: 'eCF', name: 'Producción (eCF)', description: 'Emisión real con validez fiscal ante la DGII.', icon: Rocket },
];

export function DgiiSection() {
  const { data, isLoading, error, refetch } = useDgiiOverview();
  const qc = useQueryClient();
  const onboarding = useQuery({ queryKey: queryKeys.onboarding, queryFn: settingsService.onboarding });
  const [choice, setChoice] = useState('');
  const requested = (onboarding.data?.data?.dgii as { environment?: string } | undefined)?.environment ?? 'PRUEBAS';
  const selected = choice || requested;
  const save = useMutation({
    mutationFn: () => settingsService.saveOnboardingStep(2, { environment: selected }),
    onSuccess: () => {
      setChoice('');
      void qc.invalidateQueries({ queryKey: queryKeys.onboarding });
      void qc.invalidateQueries({ queryKey: queryKeys.dgii });
      toast.success('Solicitud de ambiente guardada');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <SectionShell title="Ambiente DGII" description="Ambiente en el que LX envía tus comprobantes electrónicos.">
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-5">
          {!data?.environment && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-muted-foreground">Tu empresa aún no tiene un ambiente asignado. Completa la configuración inicial para comenzar.</p>
            </div>
          )}
          <ol className="grid gap-3 md:grid-cols-3">
            {ENVIRONMENTS.map((env, i) => {
              const current = data?.environment === env.code;
              const Icon = env.icon;
              return (
                <li key={env.code} className={cn('relative rounded-xl border p-4 transition-colors', current ? 'border-brand bg-brand-soft/40' : 'bg-background/50')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', current ? 'bg-brand text-white' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {current ? <Badge variant="brand"><CheckCircle2 className="h-3 w-3" /> Actual</Badge> : <span className="text-xs text-muted-foreground">Paso {i + 1}</span>}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{env.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{env.description}</p>
                </li>
              );
            })}
          </ol>
          <div className="space-y-3 rounded-xl border p-4">
            <Label htmlFor="requested-environment">Ambiente solicitado para la empresa</Label>
            <div className="flex flex-wrap gap-2">
              <select id="requested-environment" className="h-10 min-w-48 rounded-md border bg-background px-3 text-sm" value={selected} onChange={(event) => setChoice(event.target.value)} disabled={onboarding.isLoading || save.isPending}>
                <option value="PRUEBAS">Pruebas (TesteCF)</option>
                <option value="CERTIFICACION">Certificación (CerteCF)</option>
                <option value="PRODUCCION">Producción (eCF)</option>
              </select>
              <Button type="button" disabled={onboarding.isLoading || !!onboarding.error || save.isPending || selected === requested} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="animate-spin" />} Solicitar cambio</Button>
            </div>
            {onboarding.error && <SectionError error={onboarding.error} onRetry={() => void onboarding.refetch()} />}
            <p className="text-xs text-muted-foreground">Esta selección registra la solicitud. El ambiente activo solo cambia cuando LX confirma la habilitación correspondiente ante la DGII.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              El cambio de ambiente lo realiza LX tras completar las etapas de certificación exigidas por la DGII.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to={ROUTES.app.dgii}>Centro DGII <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
