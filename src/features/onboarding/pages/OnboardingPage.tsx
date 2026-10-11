import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { useAuth } from '@/features/auth/auth-context';
import { ROUTES } from '@/constants/routes';
import { ENV } from '@/constants/env';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { CompanySettings, OnboardingState } from '@/types/account';
import {
  clearDraft, defaultsFromCompany, LAST_STEP, loadDraft, saveDraft, STEP_FORM_ID, STEPS, type OnboardingData,
} from '../schemas';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { CompanyStep } from '../components/CompanyStep';
import { FiscalStep } from '../components/FiscalStep';
import { DgiiStep } from '../components/DgiiStep';
import { CertificateStep } from '../components/CertificateStep';
import { SequencesStep } from '../components/SequencesStep';
import { PreferencesStep } from '../components/PreferencesStep';
import { VerificationStep } from '../components/VerificationStep';
import { buildChecklist } from '../checklist';
import { OnboardingComplete } from '../components/OnboardingComplete';

type DataKey = keyof OnboardingData;
const STEP_KEYS: DataKey[] = ['company', 'fiscal', 'dgii', 'certificate', 'sequences', 'preferences'];
const clampStep = (n: number) => Math.min(Math.max(n, 0), LAST_STEP);

function OnboardingWizard({ initial, company }: { initial: OnboardingState; company?: CompanySettings }) {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const reduce = useReducedMotion();
  const [data, setData] = useState<OnboardingData>(() => ({
    ...defaultsFromCompany(company),
    ...(ENV.settingsUseMocks ? loadDraft() : initial.data as Partial<OnboardingData> | undefined),
  }));
  const [completed, setCompleted] = useState<number[]>(initial.completedSteps);
  const [step, setStep] = useState(() => clampStep(initial.currentStep));
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState<OnboardingState | null>(null);

  const maxReachable = clampStep(Math.max(step, initial.currentStep, ...completed.map((c) => c + 1)));

  const save = useMutation({
    mutationFn: ({ index, payload }: { index: number; payload: Record<string, unknown> }) => settingsService.saveOnboardingStep(index, payload),
    onSuccess: (state) => {
      queryClient.setQueryData(queryKeys.onboarding, state);
      setCompleted(state.completedSteps);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const go = (target: number) => {
    const next = clampStep(target);
    setDirection(next >= step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  const submitStep = <K extends DataKey>(key: K, values: OnboardingData[K]) => {
    const index = STEP_KEYS.indexOf(key);
    const nextData = { ...data, [key]: values };
    setData(nextData);
    if (ENV.settingsUseMocks) saveDraft(nextData);
    save.mutate(
      { index, payload: { ...values } },
      {
        onSuccess: () => {
          toast.success(`${STEPS[index].title}: guardado`);
          go(index + 1);
        },
      },
    );
  };

  const finish = () => {
    save.mutate(
      { index: LAST_STEP, payload: { confirmed: true } },
      {
        onSuccess: (state) => {
          clearDraft();
          void queryClient.invalidateQueries({ queryKey: queryKeys.settingsStatus });
          if (user?.tenant) updateUser({ tenant: { ...user.tenant, onboardingComplete: true, canIssue: state.canIssue } });
          toast.success('Configuración enviada a verificación.');
          setResult(state);
        },
      },
    );
  };

  if (result) {
    const pending = buildChecklist(data, result.completedSteps).filter((i) => !i.ok).length;
    return <OnboardingComplete canIssue={result.canIssue} pending={pending} />;
  }

  const renderStep = () => {
    switch (step) {
      case 0: return <CompanyStep defaultValues={data.company} onSubmit={(v) => submitStep('company', v)} />;
      case 1: return <FiscalStep defaultValues={data.fiscal} onSubmit={(v) => submitStep('fiscal', v)} />;
      case 2: return <DgiiStep defaultValues={data.dgii} onSubmit={(v) => submitStep('dgii', v)} />;
      case 3: return <CertificateStep defaultValues={data.certificate} onSubmit={(v) => submitStep('certificate', v)} />;
      case 4: return <SequencesStep defaultValues={data.sequences} onSubmit={(v) => submitStep('sequences', v)} />;
      case 5: return <PreferencesStep defaultValues={data.preferences} onSubmit={(v) => submitStep('preferences', v)} />;
      default: return <VerificationStep data={data} completed={completed} onEdit={go} onSubmit={finish} />;
    }
  };

  const isLast = step === LAST_STEP;

  return (
    <div className="space-y-6">
      <OnboardingStepper current={step} completed={completed} maxReachable={maxReachable} onSelect={go} />

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={step}
          custom={direction}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={step === 0 || save.isPending}>
          <ArrowLeft /> Anterior
        </Button>
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
          <span className="text-center text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length}</span>
          <Button type="submit" form={STEP_FORM_ID} size="lg" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : isLast ? <Check /> : null}
            {save.isPending ? 'Guardando...' : isLast ? 'Finalizar configuración' : 'Guardar y continuar'}
            {!save.isPending && !isLast && <ArrowRight />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const onboarding = useQuery({ queryKey: queryKeys.onboarding, queryFn: settingsService.onboarding });
  const company = useQuery({ queryKey: queryKeys.company, queryFn: settingsService.company, retry: 1 });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Configuración inicial"
        title="Configura tu empresa"
        description="Completa estos pasos para preparar la emisión de comprobantes electrónicos. Tu progreso se guarda en cada paso."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.app.root}>Continuar más tarde</Link>
          </Button>
        }
      />
      {onboarding.isPending || company.isPending ? (
        <div className="space-y-6">
          <LoadingState rows={2} />
          <LoadingState rows={6} />
        </div>
      ) : onboarding.isError || company.isError ? (
        <ErrorState error={onboarding.error ?? company.error} onRetry={() => { void onboarding.refetch(); void company.refetch(); }} />
      ) : (
        <OnboardingWizard initial={onboarding.data} company={company.data} />
      )}
    </div>
  );
}
