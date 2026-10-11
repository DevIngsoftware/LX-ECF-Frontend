import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { billingService, manualPaymentsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ModuleKey } from '@/types/account';

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  kind: 'PLAN' | 'MODULE';
  targetId: string;
  targetName: string;
  needsPlan?: boolean;
  existingTicketId?: string;
  onSubmitted?(): void;
}

export function DepositRequestDialog({ open, onOpenChange, kind, targetId, targetName, needsPlan, existingTicketId, onSubmitted }: Props) {
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: ['bank-accounts'], queryFn: manualPaymentsService.accounts, enabled: open });
  const plans = useQuery({ queryKey: queryKeys.plans, queryFn: billingService.plans, enabled: open && !!needsPlan });
  const [bankId, setBankId] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);

  useEffect(() => {
    if (!open) { setBankId(''); setPlanId(''); setAmount(''); setReference(''); setProof(null); }
  }, [open]);

  const submit = useMutation({
    mutationFn: () => manualPaymentsService.submit({
      kind,
      planId: kind === 'PLAN' ? targetId : needsPlan ? planId : undefined,
      moduleKey: kind === 'MODULE' ? targetId as ModuleKey : undefined,
      bankAccountId: bankId,
      amount: Number(amount),
      reference: reference.trim() || undefined,
      proof: proof!,
      existingTicketId,
    }),
    onSuccess: ({ ticket }) => {
      toast.success(`Comprobante enviado en el ticket #${ticket.id}`, { description: 'Superadmin revisará el depósito antes de habilitar el acceso.' });
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ['support'] });
      void qc.invalidateQueries({ queryKey: queryKeys.modules });
      onSubmitted?.();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const selected = accounts.data?.find((account) => account.id === bankId);
  const valid = !!bankId && !!proof && proof.size <= 8 * 1024 * 1024
    && Number.isFinite(Number(amount)) && Number(amount) > 0 && (!needsPlan || !!planId);

  return (
    <Dialog open={open} onOpenChange={(next) => !submit.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar comprobante de depósito</DialogTitle>
          <DialogDescription>
            {kind === 'PLAN' ? `Plan ${targetName}` : `Módulo ${targetName}`} · El acceso se activa cuando superadmin valide el depósito.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {needsPlan && (
            <div className="space-y-2">
              <Label>Plan para tu empresa</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
                <SelectContent>{plans.data?.filter((plan) => plan.active).map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">La aprobación activará este plan y el módulo solicitado por 30 días.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Cuenta para depositar</Label>
            {accounts.error && <p className="text-sm text-destructive">{errorMessage(accounts.error)}</p>}
            {accounts.data?.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay cuentas publicadas. Solicita a soporte los datos para depositar.</p>}
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder="Selecciona una cuenta" /></SelectTrigger>
              <SelectContent>{accounts.data?.map((account) => <SelectItem key={account.id} value={account.id}>{account.bankName} · {account.accountNumber}</SelectItem>)}</SelectContent>
            </Select>
            {selected && <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{selected.bankName} · {selected.accountType}</p>
              <p>Cuenta {selected.accountNumber} ({selected.currency})</p>
              <p>Titular: {selected.beneficiary}</p>
            </div>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="deposit-amount">Monto depositado (RD$)</Label><Input id="deposit-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="deposit-reference">Referencia de transferencia</Label><Input id="deposit-reference" maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="deposit-proof">Comprobante (PDF, PNG o JPG; hasta 8 MB)</Label><Input id="deposit-proof" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setProof(event.target.files?.[0] ?? null)} /></div>
          <p className="text-xs text-muted-foreground">El precio o monto acordado se confirma con tu asesor. La carga del comprobante crea un ticket para revisión; no representa una aprobación automática.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Cancelar</Button>
          <Button onClick={() => submit.mutate()} disabled={!valid || submit.isPending}>
            {submit.isPending && <Loader2 className="animate-spin" />} Enviar a revisión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
