import { CreditCard, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PaymentMethodCard() {
  return (
    <section className="surface flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Método de pago</h2>
        <Badge variant="neutral">Próximamente</Badge>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-xl border border-dashed bg-muted/40 p-4">
        <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-ink/70 text-white dark:from-muted dark:to-muted/60">
          <CreditCard className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">Pagos en línea con AZUL próximamente</p>
          <p className="text-xs text-muted-foreground">Mientras tanto, tu asesor de LX coordina el pago de tu suscripción.</p>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        LX no almacena datos de tarjetas. Los pagos se procesarán directamente en la plataforma segura de AZUL.
      </p>
    </section>
  );
}
