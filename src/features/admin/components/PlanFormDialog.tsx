import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ModuleKey, Plan } from '@/types/account';
import { MODULE_KEYS, MODULE_LABELS } from './admin-meta';

const limit = z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) > 0), 'Ingresa un número entero mayor que cero o déjalo vacío');

const schema = z.object({
  name: z.string().trim().min(2, 'Ingresa el nombre del plan').max(60, 'Máximo 60 caracteres'),
  description: z.string().trim().min(5, 'Describe brevemente el plan').max(240, 'Máximo 240 caracteres'),
  priceLabel: z.string().trim().max(60, 'Máximo 60 caracteres'),
  invoiceLimit: limit,
  userLimit: limit,
  modules: z.array(z.enum(MODULE_KEYS as [ModuleKey, ...ModuleKey[]])),
  active: z.boolean(),
  highlighted: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const toValues = (p?: Plan | null): FormValues => ({
  name: p?.name ?? '',
  description: p?.description ?? '',
  priceLabel: p?.priceLabel ?? '',
  invoiceLimit: p?.invoiceLimit != null ? String(p.invoiceLimit) : '',
  userLimit: p?.userLimit != null ? String(p.userLimit) : '',
  modules: p?.modules ?? [],
  active: p?.active ?? true,
  highlighted: p?.highlighted ?? false,
});

const toNumber = (v: string) => (v.trim() === '' ? null : Number(v));

export function PlanFormDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (o: boolean) => void; plan: Plan | null }) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(plan) });

  useEffect(() => {
    if (open) form.reset(toValues(plan));
  }, [open, plan, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      adminService.savePlan({
        id: plan?.id ?? '',
        name: v.name.trim(),
        description: v.description.trim(),
        priceLabel: v.priceLabel.trim() === '' ? null : v.priceLabel.trim(),
        invoiceLimit: toNumber(v.invoiceLimit),
        userLimit: toNumber(v.userLimit),
        modules: v.modules,
        active: v.active,
        highlighted: v.highlighted,
      }),
    onSuccess: () => {
      toast.success(plan ? 'Plan y suscripciones existentes actualizados' : 'Plan creado');
      void qc.invalidateQueries({ queryKey: queryKeys.admin.plans });
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      void qc.invalidateQueries({ queryKey: queryKeys.plans });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const text = (name: 'name' | 'priceLabel' | 'invoiceLimit' | 'userLimit', label: string, opts: { placeholder?: string; hint?: string; numeric?: boolean } = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={opts.placeholder} inputMode={opts.numeric ? 'numeric' : undefined} />
          </FormControl>
          {opts.hint && <FormDescription>{opts.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const toggle = (name: 'active' | 'highlighted', label: string, hint: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{hint}</FormDescription>
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{plan ? `Editar plan ${plan.name}` : 'Nuevo plan'}</DialogTitle>
          <DialogDescription>
            Deja el precio vacío para mostrar «Consultar». Al editar un plan, sus módulos y límites se actualizan en las suscripciones existentes de ese plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-5" noValidate>
            {text('name', 'Nombre', { placeholder: 'Empresarial' })}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {text('priceLabel', 'Precio publicado', { placeholder: 'Ejemplo: 1200', hint: 'Ingresa el monto en pesos dominicanos. Se mostrará como RD$1,200.00; si lo dejas vacío, aparecerá «Consultar».' })}
            <div className="grid gap-5 sm:grid-cols-2">
              {text('invoiceLimit', 'Límite de comprobantes', { placeholder: 'Ilimitado', numeric: true })}
              {text('userLimit', 'Límite de usuarios', { placeholder: 'Ilimitado', numeric: true })}
            </div>
            <FormField
              control={form.control}
              name="modules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Módulos incluidos</FormLabel>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MODULE_KEYS.map((m) => {
                      const checked = field.value.includes(m);
                      return (
                        <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => field.onChange(v ? [...field.value, m] : field.value.filter((x) => x !== m))}
                          />
                          {MODULE_LABELS[m]}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {toggle('active', 'Activo', 'Disponible para nuevas suscripciones.')}
            {toggle('highlighted', 'Destacado', 'Se resalta como recomendado.')}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {plan ? 'Guardar cambios' : 'Crear plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
