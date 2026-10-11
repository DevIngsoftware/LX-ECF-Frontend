import { CheckCircle2, CircleDashed, ClipboardCheck, Info, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STEP_FORM_ID, type OnboardingData } from '../schemas';
import { buildChecklist } from '../checklist';
import { StepCard } from './StepCard';

interface VerificationStepProps {
  data: OnboardingData;
  completed: number[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

export function VerificationStep({ data, completed, onEdit, onSubmit }: VerificationStepProps) {
  const items = buildChecklist(data, completed);
  const pending = items.filter((i) => !i.ok).length;

  return (
    <StepCard icon={ClipboardCheck} title="Verificación" description="Revisa el resumen de tu configuración antes de enviarla a verificación.">
      <form id={STEP_FORM_ID} onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-5" noValidate>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="success">{items.length - pending} configurados</Badge>
          {pending > 0 && <Badge variant="warning">{pending} pendientes</Badge>}
        </div>

        <ul className="divide-y overflow-hidden rounded-xl border">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-4 p-4">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', item.ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
                {item.ok ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <CircleDashed className="h-5 w-5" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className={cn('hidden text-xs font-medium sm:inline', item.ok ? 'text-success' : 'text-warning')}>{item.ok ? 'Configurado' : 'Pendiente'}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(item.step)} aria-label={`Editar ${item.label}`}>
                <PencilLine />
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            Al finalizar, LX verificará la configuración; la emisión real se habilita cuando el sistema confirme los requisitos (certificado vigente, secuencias autorizadas y habilitación ante la DGII). Puedes completar los pasos pendientes en cualquier momento desde Configuración.
          </p>
        </div>
      </form>
    </StepCard>
  );
}
