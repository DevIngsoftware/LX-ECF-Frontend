import { useQuery } from '@tanstack/react-query';
import { CreditCard, Landmark, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { manualPaymentsService } from '@/services/api/account';

export function PaymentMethodCard() {
  const accounts = useQuery({ queryKey: ['bank-accounts'], queryFn: manualPaymentsService.accounts });
  return (
    <section className="surface flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Cuentas para depósito</h2>
        <Badge variant="neutral">Transferencia</Badge>
      </div>
      {accounts.data?.map((account) => <div key={account.id} className="mt-3 rounded-xl border bg-muted/30 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium"><Landmark className="h-4 w-4" /> {account.bankName}</p>
        <p className="mt-1">{account.accountType} · {account.accountNumber} · {account.currency}</p>
        <p className="text-muted-foreground">Titular: {account.beneficiary}</p>
      </div>)}
      {accounts.data?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Aún no hay cuentas publicadas. Contacta a soporte para coordinar el pago.</p>}
      <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashed bg-muted/40 p-4">
        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-ink/70 text-white dark:from-muted dark:to-muted/60">
          <CreditCard className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Pagos en línea con AZUL próximamente</p>
          <p className="text-xs text-muted-foreground">Por ahora puedes depositar y adjuntar el comprobante para revisión de superadmin.</p>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        LX no almacena datos de tarjetas. Los pagos se procesarán directamente en la plataforma segura de AZUL.
      </p>
    </section>
  );
}
