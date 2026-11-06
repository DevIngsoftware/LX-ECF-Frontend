import { supportsInvoiceTransport } from '@/constants/ecf';
import type { InvoiceDetail } from '@/types/ecf';

type Props = Pick<InvoiceDetail, 'type' | 'conductor' | 'placa'> & { className?: string };

export function InvoiceTransportDetails({ type, conductor, placa, className }: Props) {
  const driver = conductor?.trim();
  const plate = placa?.trim();
  if (!supportsInvoiceTransport(type) || (!driver && !plate)) return null;

  return <section className={className} aria-label="Transporte del comprobante">
    <h2 className="mb-2 text-sm font-semibold">Transporte</h2>
    <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
      {driver && <div><dt className="inline text-muted-foreground">Conductor: </dt><dd className="inline">{driver}</dd></div>}
      {plate && <div><dt className="inline text-muted-foreground">Placa: </dt><dd className="inline">{plate}</dd></div>}
    </dl>
  </section>;
}
