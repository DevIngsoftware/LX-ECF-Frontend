import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SaveBar, SectionError, SectionLoading, SectionShell, useCompanySettings } from './settings-shared';

const schema = z.object({
  economicActivity: z.string().trim().min(3, 'Ingresa la actividad económica').max(150, 'Máximo 150 caracteres'),
});
type Values = z.infer<typeof schema>;

export function FiscalSection() {
  const { data, isLoading, error, refetch, save } = useCompanySettings();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { economicActivity: '' } });

  useEffect(() => {
    if (data) form.reset({ economicActivity: data.economicActivity ?? '' });
  }, [data, form]);

  return (
    <SectionShell title="Información fiscal" description="Datos tributarios registrados ante la DGII.">
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rnc">RNC</Label>
                <div className="relative">
                  <Input id="rnc" value={data?.rnc ?? ''} readOnly disabled className="pr-9 font-mono" />
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-xs text-muted-foreground">Para cambiar el RNC contacta a soporte de LX: requiere nueva habilitación ante la DGII.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal">Razón social registrada</Label>
                <Input id="legal" value={data?.legalName ?? ''} readOnly disabled />
                <p className="text-xs text-muted-foreground">Se edita en Datos de empresa.</p>
              </div>
              <FormField control={form.control} name="economicActivity" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Actividad económica</FormLabel>
                  <FormControl><Input placeholder="Ej.: Servicios de consultoría" {...field} /></FormControl>
                  <FormDescription>Tal como figura en tu registro de contribuyente.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <SaveBar pending={save.isPending} dirty={form.formState.isDirty} onReset={() => form.reset({ economicActivity: data?.economicActivity ?? '' })} />
          </form>
        </Form>
      )}
    </SectionShell>
  );
}
