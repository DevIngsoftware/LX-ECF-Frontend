import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CompanySettings } from '@/types/account';
import { SaveBar, SectionError, SectionLoading, SectionShell, useCompanySettings } from './settings-shared';

const schema = z.object({
  legalName: z.string().trim().min(3, 'Ingresa la razón social').max(150, 'Máximo 150 caracteres'),
  tradeName: z.string().trim().max(150, 'Máximo 150 caracteres'),
  email: z.string().trim().min(1, 'Ingresa el correo').email('Correo electrónico no válido'),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').refine((v) => v === '' || /^[\d\s()+-]{7,20}$/.test(v), 'Teléfono no válido'),
  address: z.string().trim().max(250, 'Máximo 250 caracteres'),
});
type Values = z.infer<typeof schema>;

const toValues = (data?: CompanySettings): Values => ({
  legalName: data?.legalName ?? '',
  tradeName: data?.tradeName ?? '',
  email: data?.email ?? '',
  phone: data?.phone ?? '',
  address: data?.address ?? '',
});

export function CompanySection() {
  const { data, isLoading, error, refetch, save } = useCompanySettings();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { legalName: '', tradeName: '', email: '', phone: '', address: '' } });

  useEffect(() => {
    if (data) form.reset(toValues(data));
  }, [data, form]);

  const onSubmit = (v: Values) =>
    save.mutate({ ...v, tradeName: v.tradeName || undefined, phone: v.phone || undefined, address: v.address || undefined });

  return (
    <SectionShell title="Datos de empresa" description="Información que aparece en tus comprobantes y comunicaciones.">
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="legalName" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Razón social</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tradeName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre comercial <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo de facturación</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Input type="tel" placeholder="809-000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Dirección <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <SaveBar pending={save.isPending} dirty={form.formState.isDirty} onReset={() => form.reset(toValues(data))} />
          </form>
        </Form>
      )}
    </SectionShell>
  );
}
