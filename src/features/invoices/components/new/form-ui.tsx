import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function FormSection({ id, step, title, description, children, aside }: { id: string; step: number; title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <motion.section
      id={id}
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="surface scroll-mt-24 p-5 sm:p-6"
      aria-labelledby={`${id}-title`}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{step}</span>
          <div>
            <h2 id={`${id}-title`} className="font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function Field({ id, label, error, hint, required, className, children }: { id: string; label: string; error?: string; hint?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="ml-0.5 text-brand" aria-hidden>*</span>}
      </Label>
      {children}
      {error ? <FieldError message={error} id={`${id}-error`} /> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Convierte un input numérico vacío en undefined en lugar de NaN. */
export const optionalNumber = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v));
