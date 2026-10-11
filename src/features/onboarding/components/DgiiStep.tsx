import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, ServerCog } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { dgiiSchema, STEP_FORM_ID, type DgiiEnvironment, type DgiiStepValues } from '../schemas';
import { ENVIRONMENT_INFO } from '../checklist';
import { StepCard, type StepProps } from './StepCard';

export function DgiiStep({ defaultValues, onSubmit }: StepProps<DgiiStepValues>) {
  const form = useForm<DgiiStepValues>({ resolver: zodResolver(dgiiSchema), defaultValues });

  return (
    <StepCard icon={ServerCog} title="Configuración DGII" description="Selecciona el ambiente de la DGII con el que trabajará tu empresa.">
      <Form {...form}>
        <form id={STEP_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 md:grid-cols-3" aria-label="Ambiente DGII">
                    {(Object.keys(ENVIRONMENT_INFO) as DgiiEnvironment[]).map((key) => {
                      const info = ENVIRONMENT_INFO[key];
                      const selected = field.value === key;
                      return (
                        <label
                          key={key}
                          htmlFor={`env-${key}`}
                          className={cn(
                            'relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all',
                            selected ? 'border-brand bg-brand-soft/40 shadow-card' : 'border-border hover:border-foreground/30',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', selected ? 'bg-brand text-white' : 'bg-muted text-foreground')}>
                              <info.icon className="h-4 w-4" aria-hidden />
                            </span>
                            <RadioGroupItem id={`env-${key}`} value={key} />
                          </div>
                          <div>
                            <p className="font-semibold">{info.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{info.text}</p>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
            <p className="leading-relaxed text-muted-foreground">
              LX e-CF se conecta a los servicios oficiales de la DGII a través de su backend. El equipo de LX verificará que el ambiente elegido corresponda a la situación de tu empresa ante la DGII antes de habilitar la emisión.
            </p>
          </div>
        </form>
      </Form>
    </StepCard>
  );
}
