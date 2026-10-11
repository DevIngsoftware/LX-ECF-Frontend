import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calculator, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expensesService, partiesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ExpenseInput } from '@/types/business';
import { fromInputDate } from '@/utils/dates';
import { formatMoney } from '@/utils/format';

const OTHER = '__other__';
const NONE = '__none__';

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const schema = z
  .object({
    date: z.string().min(1, 'Selecciona la fecha').refine((v) => v <= todayInput(), 'La fecha no puede ser futura'),
    category: z.string().min(1, 'Selecciona una categoría'),
    description: z.string().trim().min(3, 'Describe el gasto').max(200, 'Máximo 200 caracteres'),
    supplierId: z.string(),
    supplierName: z.string().trim().max(150, 'Máximo 150 caracteres'),
    supplierRnc: z
      .string()
      .trim()
      .refine((v) => v === '' || /^(\d{9}|\d{11})$/.test(v.replace(/[\s-]/g, '')), 'Debe tener 9 u 11 dígitos'),
    ncf: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => v === '' || /^(E\d{12}|B\d{10})$/.test(v), 'Formato inválido (ej.: E310000000001 o B0100000001)'),
    amount: z.coerce.number({ invalid_type_error: 'Ingresa un monto válido' }).positive('El monto debe ser mayor que cero').max(999_999_999, 'Monto demasiado alto'),
    itbis: z.coerce.number({ invalid_type_error: 'Ingresa un monto válido' }).min(0, 'No puede ser negativo'),
  })
  .refine((v) => v.itbis <= v.amount, { path: ['itbis'], message: 'El ITBIS no puede superar el monto' })
  .refine((v) => v.supplierId !== OTHER || v.supplierName.length >= 2, { path: ['supplierName'], message: 'Ingresa el nombre del proveedor' });

type FormValues = z.infer<typeof schema>;

const defaults = (): FormValues => ({
  date: todayInput(), category: '', description: '', supplierId: NONE, supplierName: '', supplierRnc: '', ncf: '', amount: 0, itbis: 0,
});

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
}

export function ExpenseFormDialog({ open, onOpenChange, categories }: ExpenseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        {open && <ExpenseForm categories={categories} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({ categories, onClose }: { categories: string[]; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults() });
  const supplierQuery = { page: 0, size: 100, active: 'active' as const };
  const suppliers = useQuery({
    queryKey: queryKeys.parties('suppliers', supplierQuery),
    queryFn: () => partiesService.list('suppliers', supplierQuery),
  });
  const supplierList = suppliers.data?.content ?? [];
  const supplierId = form.watch('supplierId');
  const manualSupplier = supplierId === OTHER || !!suppliers.error;

  const save = useMutation({
    mutationFn: (input: ExpenseInput) => expensesService.create(input),
    onSuccess: () => {
      toast.success('Gasto registrado');
      void qc.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onSubmit = (v: FormValues) => {
    const s = supplierList.find((x) => x.id === v.supplierId);
    const supplierName = s ? s.legalName : manualSupplier ? v.supplierName || undefined : undefined;
    const supplierRnc = s ? s.rnc : manualSupplier ? v.supplierRnc.replace(/[\s-]/g, '') || undefined : undefined;
    save.mutate({
      date: fromInputDate(v.date),
      category: v.category,
      description: v.description.trim(),
      supplierName,
      supplierRnc,
      ncf: v.ncf || undefined,
      amount: Math.round(v.amount * 100) / 100,
      itbis: Math.round(v.itbis * 100) / 100,
    });
  };

  const amount = Number(form.watch('amount')) || 0;
  const itbis = Number(form.watch('itbis')) || 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar gasto</DialogTitle>
        <DialogDescription>Clasifica tus gastos para el control interno y la preparación de reportes.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl><Input {...field} type="date" max={todayInput()} /></FormControl>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                <FormLabel>Descripción</FormLabel>
                <FormControl><Input {...field} placeholder="Ej.: Factura de electricidad de oficina" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!suppliers.error && (
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={suppliers.isLoading}>
                    <FormControl><SelectTrigger><SelectValue placeholder={suppliers.isLoading ? 'Cargando…' : 'Selecciona'} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin proveedor</SelectItem>
                      {supplierList.map((s) => <SelectItem key={s.id} value={s.id}>{s.legalName}</SelectItem>)}
                      <SelectItem value={OTHER}>Otro (ingresar manualmente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {manualSupplier && (
            <div className="grid gap-5 animate-fade-up sm:grid-cols-2">
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del proveedor</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierRnc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RNC / Cédula</FormLabel>
                    <FormControl><Input {...field} inputMode="numeric" className="font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          <FormField
            control={form.control}
            name="ncf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NCF / e-NCF <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Input {...field} className="font-mono uppercase" placeholder="E310000000001" /></FormControl>
                <FormDescription>Necesario si el gasto debe sustentar crédito fiscal.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto sin ITBIS (RD$)</FormLabel>
                  <FormControl><Input {...field} type="number" inputMode="decimal" step="0.01" min={0} className="tabular-nums" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itbis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ITBIS (RD$)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl><Input {...field} type="number" inputMode="decimal" step="0.01" min={0} className="tabular-nums" /></FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => form.setValue('itbis', Math.round(amount * 18) / 100, { shouldValidate: true })}
                      aria-label="Calcular ITBIS al 18%"
                      title="Calcular 18%"
                    >
                      <Calculator />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Total del gasto</span>
            <span className="font-display text-lg font-bold tabular-nums">{formatMoney(amount + itbis)}</span>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Registrar gasto
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
