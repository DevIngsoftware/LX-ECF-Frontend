import { useFormContext, useWatch } from 'react-hook-form';
import { Check } from 'lucide-react';
import { ECF_TYPES, ECF_TYPE_MAP } from '@/constants/ecf';
import type { EcfTypeCode } from '@/types/ecf';
import { cn } from '@/lib/utils';
import { FormSection } from './form-ui';
import type { InvoiceFormValues } from './schema';

export function TypeSection({ step, locked }: { step: number; locked?: boolean }) {
  const { control, setValue, getValues } = useFormContext<InvoiceFormValues>();
  const current = useWatch({ control, name: 'type' });

  const select = (code: EcfTypeCode) => {
    if (locked || code === current) return;
    setValue('type', code, { shouldDirty: true });
    const cfg = ECF_TYPE_MAP[code];
    if (!cfg.allowsCredit && getValues('paymentType') === '2') setValue('paymentType', '1', { shouldDirty: true });
    if (!cfg.allowsRetentions) setValue('retentions', { itbis: 0, isr: 0 });
  };

  return (
    <FormSection
      id="sec-tipo"
      step={step}
      title="Tipo de comprobante"
      description={locked ? 'El tipo se definió a partir del comprobante de referencia.' : 'Elige el e-CF que deseas emitir. El formulario se adapta al tipo seleccionado.'}
    >
      <div role="radiogroup" aria-label="Tipo de comprobante" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {ECF_TYPES.map((t) => {
          const active = t.code === current;
          return (
            <button
              key={t.code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={locked && !active}
              onClick={() => select(t.code)}
              className={cn(
                'group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                active ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'bg-card hover:border-foreground/30 hover:bg-muted/40',
                locked && !active && 'opacity-40',
              )}
            >
              <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold', active ? 'bg-brand text-white' : 'bg-foreground text-background')}>{t.code}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{t.short}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{t.description}</span>
              </span>
              {active && <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden />}
            </button>
          );
        })}
      </div>
    </FormSection>
  );
}
