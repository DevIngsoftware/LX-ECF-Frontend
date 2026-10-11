import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { companySchema, STEP_FORM_ID, type CompanyStepValues } from '../schemas';
import { StepCard, type StepProps } from './StepCard';

export function CompanyStep({ defaultValues, onSubmit }: StepProps<CompanyStepValues>) {
  const form = useForm<CompanyStepValues>({ resolver: zodResolver(companySchema), defaultValues });

  return (
    <StepCard icon={Building2} title="Información de la empresa" description="Datos generales que aparecerán en tus comprobantes y comunicaciones.">
      <Form {...form}>
        <form id={STEP_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Razón social</FormLabel>
                <FormControl><Input placeholder="Mi Empresa, S.R.L." autoComplete="organization" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tradeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre comercial <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Input placeholder="Mi Empresa" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo de facturación</FormLabel>
                <FormControl><Input type="email" placeholder="facturacion@empresa.com" autoComplete="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Input type="tel" placeholder="809-000-0000" autoComplete="tel" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl><Input placeholder="Calle, número, sector, ciudad" autoComplete="street-address" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </StepCard>
  );
}
