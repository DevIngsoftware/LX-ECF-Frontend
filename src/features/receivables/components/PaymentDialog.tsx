import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { receivablesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Receivable } from '@/types/business';
import { toInputDate } from '@/utils/dates';
import { formatMoney } from '@/utils/format';
import { PAYMENT_METHODS } from './receivables-utils';

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const makeSchema = (balance: number, issueDate: string) =>
  z.object({
    amount: z.coerce
      .number({ invalid_type_error: 'Ingresa un monto válido' })
      .positive('El monto debe ser mayor que cero')
      .max(balance, `El monto no puede superar el saldo pendiente (${formatMoney(balance)})`),
    method: z.string().min(1, 'Selecciona el método de cobro'),
    date: z
      .string()
      .min(1, 'Selecciona la fecha')
      .refine((v) => v <= todayInput(), 'La fecha no puede ser futura')
      .refine((v) => v >= toInputDate(issueDate), 'La fecha no puede ser anterior a la emisión de la factura'),
    reference: z.string().trim().max(60, 'Máximo 60 caracteres'),
  });

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface PaymentDialogProps {
  receivable: Receivable | null;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ receivable, onOpenChange }: PaymentDialogProps) {
  return (
    <Dialog open={!!receivable} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {receivable && <PaymentForm key={receivable.id} receivable={receivable} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ receivable, onClose }: { receivable: Receivable; onClose: () => void }) {
  const qc = useQueryClient();
  const balance = receivable.balance;
  const schema = useMemo(() => makeSchema(balance, receivable.issueDate), [balance, receivable.issueDate]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: balance, method: '', date: todayInput(), reference: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      receivablesService.registerPayment({
        receivableId: receivable.id,
        amount: Math.round(v.amount * 100) / 100,
        method: v.method,
        date: v.date,
        reference: v.reference.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Cobro registrado', { description: 'El saldo de la cuenta se actualizó.' });
      void qc.invalidateQueries({ queryKey: ['receivables'] });
      void qc.invalidateQueries({ queryKey: queryKeys.payments });
      void qc.invalidateQueries({ queryKey: queryKeys.invoice(receivable.invoiceId) });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
          <DialogDescription>
            Factura <span className="font-mono font-medium text-foreground">{receivable.encf}</span> · {receivable.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-xs text-warning">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p><strong>Registro manual de cobro — no procesa pagos.</strong> Solo deja constancia de un cobro recibido por otro medio. No modifica el estado fiscal del comprobante.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Total factura</p><p className="font-medium tabular-nums">{formatMoney(receivable.total ?? 0)}</p></div>
          <div><p className="text-xs text-muted-foreground">Saldo pendiente</p><p className="font-semibold tabular-nums text-brand">{formatMoney(balance)}</p></div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (RD$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" inputMode="decimal" step="0.01" min={0} max={balance} className="tabular-nums" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de cobro</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" max={todayInput()} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona el método" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Número de transferencia, cheque, recibo…" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Registrar cobro
              </Button>
            </DialogFooter>
          </form>
        </Form>
    </>
  );
}
