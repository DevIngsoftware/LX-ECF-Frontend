import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

export interface TotalsValues {
  subtotal: number;
  discount: number;
  itbis: number;
  itbisByRate?: { rate: number; amount: number }[];
  retainedItbis: number;
  retainedIsr: number;
  total: number;
}

/** Desglose de totales en RD$. Si hay retenciones, muestra el neto a cobrar por separado. */
export function TotalsList({ values, className, dense }: { values: TotalsValues; className?: string; dense?: boolean }) {
  const hasRetentions = values.retainedItbis > 0 || values.retainedIsr > 0;
  const row = (label: string, value: number, opts: { muted?: boolean; negative?: boolean } = {}) => (
    <div className={cn('flex items-center justify-between gap-4', opts.muted && 'text-muted-foreground')}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{opts.negative && value > 0 ? `− ${formatMoney(value)}` : formatMoney(value)}</dd>
    </div>
  );
  return (
    <dl className={cn('space-y-1.5 text-sm', dense && 'text-xs', className)}>
      {row('Subtotal', values.subtotal + values.discount, { muted: true })}
      {values.discount > 0 && row('Descuentos', values.discount, { muted: true, negative: true })}
      {row('Monto gravado / exento', values.subtotal, { muted: true })}
      {values.itbisByRate && values.itbisByRate.length > 1
        ? values.itbisByRate.map((r) => <div key={r.rate}>{row(`ITBIS ${r.rate}%`, r.amount, { muted: true })}</div>)
        : row('ITBIS', values.itbis, { muted: true })}
      <div className="my-2 border-t" />
      <div className="flex items-center justify-between gap-4 text-base font-semibold">
        <dt>Total</dt>
        <dd className="font-display tabular-nums">{formatMoney(values.total)}</dd>
      </div>
      {hasRetentions && (
        <>
          {values.retainedItbis > 0 && row('ITBIS retenido', values.retainedItbis, { muted: true, negative: true })}
          {values.retainedIsr > 0 && row('ISR retenido', values.retainedIsr, { muted: true, negative: true })}
          <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-3 py-2 font-semibold">
            <dt>Neto a recibir</dt>
            <dd className="tabular-nums">{formatMoney(values.total - values.retainedItbis - values.retainedIsr)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}
