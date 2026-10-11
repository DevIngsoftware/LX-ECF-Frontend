import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ITBIS_RATES } from '@/constants/ecf';
import { preferencesSchema, STEP_FORM_ID, type PreferencesStepValues } from '../schemas';
import { StepCard, type StepProps } from './StepCard';

export function PreferencesStep({ defaultValues, onSubmit }: StepProps<PreferencesStepValues>) {
  const form = useForm<PreferencesStepValues>({ resolver: zodResolver(preferencesSchema), defaultValues });

  return (
    <StepCard icon={SlidersHorizontal} title="Preferencias de facturación" description="Valores que se aplicarán por defecto al crear comprobantes. Podrás cambiarlos en cada documento.">
      <Form {...form}>
        <form id={STEP_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-3" noValidate>
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="DOP">Peso dominicano (RD$)</SelectItem>
                    <SelectItem value="USD">Dólar estadounidense (US$)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="itbisRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ITBIS por defecto</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ITBIS_RATES.map((r) => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentTermDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plazo de pago (días)</FormLabel>
                <FormControl><Input inputMode="numeric" maxLength={3} placeholder="30" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentConditions"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Condiciones de pago <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Textarea rows={2} placeholder="Ej.: Pago mediante transferencia bancaria dentro del plazo indicado." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Notas al pie del comprobante <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Textarea rows={2} placeholder="Ej.: Gracias por preferirnos." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sendEmailToBuyer"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 space-y-0 rounded-xl border p-4 sm:col-span-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Enviar comprobante por correo al comprador</FormLabel>
                  <FormDescription>Se enviará la representación impresa cuando el comprobante tenga correo registrado.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </StepCard>
  );
}
