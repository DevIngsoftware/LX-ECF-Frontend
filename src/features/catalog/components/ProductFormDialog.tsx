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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ITBIS_RATES } from '@/constants/ecf';
import { catalogService } from '@/services/api/operations';
import { errorMessage } from '@/services/http/errors';
import type { Product, ProductInput } from '@/types/business';
import { formatMoney } from '@/utils/format';

const schema = z.object({
  code: z.string().trim().min(1, 'El código es obligatorio').max(30, 'Máximo 30 caracteres').regex(/^[\w.-]+$/, 'Usa letras, números, guiones o puntos'),
  name: z.string().trim().min(2, 'Ingresa el nombre').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres'),
  kind: z.enum(['BIEN', 'SERVICIO'], { errorMap: () => ({ message: 'Selecciona el tipo' }) }),
  price: z.coerce.number({ invalid_type_error: 'Ingresa un precio válido' }).min(0, 'El precio no puede ser negativo').max(999_999_999, 'Precio demasiado alto'),
  itbisRate: z.coerce.number().refine((v) => ITBIS_RATES.some((r) => r.value === v), 'Selecciona una tasa válida'),
  category: z.string().trim().max(60, 'Máximo 60 caracteres'),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const toValues = (p?: Product | null): FormValues => ({
  code: p?.code ?? '',
  name: p?.name ?? '',
  description: p?.description ?? '',
  kind: p?.kind ?? 'BIEN',
  price: p?.price ?? 0,
  itbisRate: p?.itbisRate ?? 18,
  category: p?.category ?? '',
  active: p?.active ?? true,
});

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const qc = useQueryClient();
  const isEdit = !!product;
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(product) });

  useEffect(() => {
    if (open) form.reset(toValues(product));
  }, [open, product, form]);

  const save = useMutation({
    mutationFn: (input: ProductInput) => (product ? catalogService.update(product.id, input) : catalogService.create(input)),
    onSuccess: () => {
      toast.success(isEdit ? 'Artículo actualizado' : 'Artículo creado');
      void qc.invalidateQueries({ queryKey: ['catalog'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onSubmit = (v: FormValues) =>
    save.mutate({
      code: v.code.trim(),
      name: v.name.trim(),
      description: v.description.trim() || undefined,
      kind: v.kind,
      price: Math.round(v.price * 100) / 100,
      itbisRate: v.itbisRate,
      category: v.category.trim() || undefined,
      active: v.active,
    });

  const price = Number(form.watch('price')) || 0;
  const rate = Number(form.watch('itbisRate')) || 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
          <DialogDescription>Los artículos del catálogo se autocompletan al emitir comprobantes.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <ToggleGroup type="single" value={field.value} onValueChange={(v) => v && field.onChange(v)} className="grid grid-cols-2 rounded-lg border bg-muted/40 p-1">
                      <ToggleGroupItem value="BIEN" className="h-9 data-[state=on]:bg-card data-[state=on]:shadow-sm">Bien</ToggleGroupItem>
                      <ToggleGroupItem value="SERVICIO" className="h-9 data-[state=on]:bg-card data-[state=on]:shadow-sm">Servicio</ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono" placeholder="PRD-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio unitario (RD$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" inputMode="decimal" step="0.01" min={0} className="tabular-nums" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itbisRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa ITBIS</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ITBIS_RATES.map((r) => (
                          <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="General" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>ITBIS por unidad</span><span className="tabular-nums">{formatMoney((price * rate) / 100)}</span></div>
              <div className="mt-1 flex justify-between font-semibold"><span>Precio con ITBIS</span><span className="tabular-nums">{formatMoney(price * (1 + rate / 100))}</span></div>
            </div>
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>Solo los artículos activos aparecen al facturar.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {isEdit ? 'Guardar cambios' : 'Crear artículo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
