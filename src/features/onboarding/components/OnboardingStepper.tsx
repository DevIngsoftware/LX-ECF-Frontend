import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS } from '../schemas';

interface OnboardingStepperProps {
  current: number;
  completed: number[];
  maxReachable: number;
  onSelect: (step: number) => void;
}

export function OnboardingStepper({ current, completed, maxReachable, onSelect }: OnboardingStepperProps) {
  const reduce = useReducedMotion();
  const progress = (current / (STEPS.length - 1)) * 100;
  const transition = { duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <nav aria-label="Progreso de configuración" className="surface p-4 sm:p-5">
      {/* Móvil: compacto */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Paso {current + 1} de {STEPS.length}</p>
            <p className="truncate font-display text-base font-bold">{STEPS[current].title}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
            {Math.round(((current + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-brand" initial={false} animate={{ width: `${((current + 1) / STEPS.length) * 100}%` }} transition={transition} />
        </div>
        <div className="mt-3 flex justify-between gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(i)}
              disabled={i > maxReachable}
              aria-label={`Ir a ${s.title}`}
              aria-current={i === current ? 'step' : undefined}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors disabled:cursor-not-allowed',
                i === current ? 'bg-brand' : completed.includes(i) ? 'bg-foreground/60' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      {/* Escritorio: horizontal */}
      <ol className="relative hidden md:flex md:items-start md:justify-between">
        <span className="absolute left-5 right-5 top-5 h-0.5 -translate-y-1/2 bg-border" aria-hidden />
        <span className="absolute left-5 right-5 top-5 h-0.5 -translate-y-1/2" aria-hidden>
          <motion.span className="block h-full bg-brand" initial={false} animate={{ width: `${progress}%` }} transition={transition} />
        </span>
        {STEPS.map((s, i) => {
          const done = completed.includes(i) && i !== current;
          const active = i === current;
          return (
            <li key={s.key} className="relative z-10 flex w-24 flex-col items-center text-center lg:w-28">
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={i > maxReachable}
                aria-current={active ? 'step' : undefined}
                aria-label={`${s.title}${done ? ' (completado)' : ''}`}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 disabled:cursor-not-allowed',
                  active && 'border-brand bg-brand text-white shadow-lg shadow-brand/30',
                  done && 'border-foreground bg-foreground text-background hover:scale-105',
                  !active && !done && 'border-border bg-card text-muted-foreground enabled:hover:border-foreground/40',
                )}
              >
                {active && !reduce && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/40" aria-hidden />}
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </button>
              <span className={cn('mt-2 text-xs font-medium leading-tight', active ? 'text-foreground' : 'text-muted-foreground')}>{s.short}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
