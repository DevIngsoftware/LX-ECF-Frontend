import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { fiscalSchema, STEP_FORM_ID, type FiscalStepValues } from '../schemas';
import { StepCard, type StepProps } from './StepCard';

export function FiscalStep({ defaultValues, onSubmit }: StepProps<FiscalStepValues>) {
  const form = useForm<FiscalStepValues>({ resolver: zodResolver(fiscalSchema), defaultValues });

  return (
    <StepCard icon={Landmark} title="Datos fiscales" description="Información tributaria registrada ante la DGII. Debe coincidir con tu registro como contribuyente.">
      <Form {...form}>
        <form
          id={STEP_FORM_ID}
          onSubmit={form.handleSubmit((v) => onSubmit({ ...v, rnc: v.rnc.replace(/-/g, '') }))}
          className="grid gap-5 sm:grid-cols-2"
          noValidate
        >
          <FormField
            control={form.control}
            name="rnc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RNC</FormLabel>
                <FormControl><Input inputMode="numeric" maxLength={13} placeholder="9 u 11 dígitos" {...field} /></FormControl>
                <FormDescription>Sin guiones. Se usará como RNC emisor en cada e-CF.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia / municipio</FormLabel>
                <FormControl><Input placeholder="Santo Domingo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="economicActivity"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Actividad económica principal</FormLabel>
                <FormControl><Input placeholder="Ej.: Venta al por mayor de equipos" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </StepCard>
  );
}
