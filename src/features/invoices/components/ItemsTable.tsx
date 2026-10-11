import type { InvoiceItem } from '@/types/ecf';
import { formatMoney, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { lineItbis, lineNet } from '../lib/invoice-math';

export function ItemsTable({ items, className, print }: { items: InvoiceItem[]; className?: string; print?: boolean }) {
  return (
    <div className={cn('scrollbar-thin overflow-x-auto', className)}>
      <table className={cn('w-full text-sm', !print && 'min-w-[640px]')}>
        <thead>
          <tr className={cn('text-left text-xs uppercase tracking-wide text-muted-foreground', print ? 'border-b-2 border-foreground' : 'border-b')}>
            <th scope="col" className="py-2 pr-3 font-semibold">#</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Descripción</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Cant.</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Precio</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">Desc.</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">ITBIS</th>
            <th scope="col" className="py-2 text-right font-semibold">Importe</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id ?? i} className="border-b last:border-0">
              <td className="py-2.5 pr-3 align-top tabular-nums text-muted-foreground">{i + 1}</td>
              <td className="py-2.5 pr-3 align-top">
                <p className="font-medium">{it.description}</p>
                <p className="text-xs text-muted-foreground">
                  {it.code && <span className="font-mono">{it.code} · </span>}
                  {it.kind === 'BIEN' ? 'Bien' : 'Servicio'}
                </p>
              </td>
              <td className="py-2.5 pr-3 text-right align-top tabular-nums">{formatNumber(it.quantity)}</td>
              <td className="py-2.5 pr-3 text-right align-top tabular-nums">{formatMoney(it.unitPrice)}</td>
              <td className="py-2.5 pr-3 text-right align-top tabular-nums text-muted-foreground">{it.discount ? formatMoney(it.discount) : '—'}</td>
              <td className="py-2.5 pr-3 text-right align-top tabular-nums">
                {it.itbisRate > 0 ? formatMoney(lineItbis(it)) : 'Exento'}
                {it.itbisRate > 0 && <span className="block text-xs text-muted-foreground">{it.itbisRate}%</span>}
              </td>
              <td className="py-2.5 text-right align-top font-medium tabular-nums">{formatMoney(lineNet(it))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
