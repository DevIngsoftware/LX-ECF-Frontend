import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, HandCoins, Landmark, Wallet } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/states';
import { ROUTES } from '@/constants/routes';
import type { Receivable, ReceivablePayment } from '@/types/business';
import { formatDate, formatMoney } from '@/utils/format';
import { FiscalStatusCell } from './FiscalStatus';
import { daysOverdue } from './receivables-utils';

interface ReceivableSheetProps {
  receivable: Receivable | null;
  onOpenChange: (open: boolean) => void;
  payments?: ReceivablePayment[];
  paymentsLoading: boolean;
  paymentsError: unknown;
  onRetryPayments: () => void;
  canWrite: boolean;
  canViewInvoice: boolean;
  onRegisterPayment: (r: Receivable) => void;
}

export function ReceivableSheet({
  receivable: r, onOpenChange, payments, paymentsLoading, paymentsError, onRetryPayments, canWrite, canViewInvoice, onRegisterPayment,
}: ReceivableSheetProps) {
  const history = r ? (payments ?? []).filter((p) => p.receivableId === r.id) : [];
  const pct = r && r.total > 0 ? Math.min(100, Math.round((r.paid / r.total) * 100)) : 0;
  const overdueDays = r ? daysOverdue(r.dueDate) : 0;

  return (
    <Sheet open={!!r} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {r && (
          <>
            <SheetHeader className="border-b p-6 text-left">
              <SheetTitle className="font-mono text-lg">{r.encf}</SheetTitle>
              <SheetDescription>{r.customerName}</SheetDescription>
            </SheetHeader>
            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark className="h-3.5 w-3.5" /> Estado fiscal (DGII)</p>
                  <FiscalStatusCell invoiceId={r.invoiceId} />
                </div>
                <div className="rounded-xl border p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Estado de pago</p>
                  <PaymentStatusBadge status={r.status} />
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                    <p className="font-display text-2xl font-bold tabular-nums">{formatMoney(r.balance)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}% cobrado</p>
                </div>
                <Progress value={pct} className="h-2" aria-label="Porcentaje cobrado" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Total</p><p className="tabular-nums">{formatMoney(r.total)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Cobrado</p><p className="tabular-nums">{formatMoney(r.paid)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Emisión</p><p>{formatDate(r.issueDate)}</p></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimiento</p>
                    <p className={overdueDays > 0 && r.balance > 0 ? 'font-medium text-destructive' : undefined}>
                      {formatDate(r.dueDate)}
                      {overdueDays > 0 && r.balance > 0 && <span className="block text-xs">{overdueDays} día(s) de atraso</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {canWrite && r.balance > 0 && (
                  <Button className="flex-1" onClick={() => onRegisterPayment(r)}><HandCoins /> Registrar cobro</Button>
                )}
                {canViewInvoice && (
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to={ROUTES.app.invoice(r.invoiceId)}><ExternalLink /> Ver comprobante</Link>
                  </Button>
                )}
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Historial de cobros</h3>
                {paymentsError ? (
                  <ErrorState compact error={paymentsError} onRetry={onRetryPayments} />
                ) : paymentsLoading ? (
                  <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : history.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Sin cobros registrados para esta factura.</p>
                ) : (
                  <ol className="relative space-y-3 border-l pl-5">
                    {history.map((p, i) => (
                      <motion.li key={p.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" aria-hidden />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{p.method}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(p.date)}{p.reference ? ` · ${p.reference}` : ''}</p>
                          </div>
                          <p className="font-semibold tabular-nums text-success">{formatMoney(p.amount)}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                )}
                <p className="text-xs text-muted-foreground">Los cobros son registros manuales; la plataforma no procesa pagos.</p>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
