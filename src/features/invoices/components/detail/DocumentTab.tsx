import { ExternalLink, FileCode2, FileDown, Printer, QrCode } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { Button } from '@/components/ui/button';
import { ECF_TYPE_MAP, INCOME_TYPES, PAYMENT_TYPES } from '@/constants/ecf';
import { useAuth } from '@/features/auth/auth-context';
import type { InvoiceDetail } from '@/types/ecf';
import { formatDate, formatDateTime } from '@/utils/format';
import { ItemsTable } from '../ItemsTable';
import { TotalsList } from '../TotalsList';
import { detailTotals } from '../../lib/invoice-math';

export const PRINT_AREA_ID = 'ecf-print-area';

/** Al imprimir, solo se muestra el área del documento. */
export const PRINT_STYLES = `@media print {
  body * { visibility: hidden !important; }
  #${PRINT_AREA_ID}, #${PRINT_AREA_ID} * { visibility: visible !important; }
  #${PRINT_AREA_ID} { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; background: #fff !important; color: #000 !important; }
  @page { margin: 14mm; }
}`;

interface Props {
  invoice: InvoiceDetail;
  onDownload: (kind: 'pdf' | 'xml') => void;
  onPrint: () => void;
}

export function DocumentTab({ invoice, onDownload, onPrint }: Props) {
  const { user } = useAuth();
  const type = ECF_TYPE_MAP[invoice.type];
  const verificationUrl = invoice.verificationUrl;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={onPrint}><Printer /> Imprimir</Button>
        <Button variant="outline" size="sm" onClick={() => onDownload('pdf')}><FileDown /> PDF</Button>
        <Button variant="outline" size="sm" onClick={() => onDownload('xml')}><FileCode2 /> XML</Button>
        <p className="text-xs text-muted-foreground sm:ml-auto">Vista previa orientativa. La representación impresa oficial la genera el backend.</p>
      </div>

      <article id={PRINT_AREA_ID} className="surface mx-auto max-w-4xl p-6 sm:p-10" aria-label={`Documento ${invoice.encf}`}>
        <header className="flex flex-col gap-6 border-b-2 border-foreground pb-6 sm:flex-row sm:justify-between">
          <div className="space-y-1">
            <p className="font-display text-xl font-bold">{user?.tenant?.name ?? 'Emisor'}</p>
            <p className="text-sm text-muted-foreground">RNC {user?.tenant?.rnc ?? '—'}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">{type?.name ?? invoice.type}</p>
            <div className="flex items-center gap-1 sm:justify-end">
              <p className="font-mono text-lg font-bold">{invoice.encf}</p>
              <CopyButton value={invoice.encf} label="Copiar e-NCF" className="print:hidden" />
            </div>
            <p className="text-sm text-muted-foreground">Fecha de emisión: {formatDate(invoice.issueDate)}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{type?.buyerLabel ?? 'Comprador'}</p>
            <p className="font-semibold">{invoice.buyer.name ?? invoice.buyerName}</p>
            {(invoice.buyer.rnc ?? invoice.buyerRnc) && <p className="font-mono text-xs">RNC/Cédula {invoice.buyer.rnc ?? invoice.buyerRnc}</p>}
            {invoice.buyer.foreignId && <p className="font-mono text-xs">ID {invoice.buyer.foreignId} {invoice.buyer.country && `· ${invoice.buyer.country}`}</p>}
            {invoice.buyer.email && <p className="text-muted-foreground">{invoice.buyer.email}</p>}
          </div>
          <div className="space-y-0.5 sm:text-right">
            <p><span className="text-muted-foreground">Tipo de ingreso: </span>{INCOME_TYPES.find((t) => t.value === invoice.incomeType)?.label ?? invoice.incomeType}</p>
            <p><span className="text-muted-foreground">Forma de pago: </span>{PAYMENT_TYPES.find((t) => t.value === invoice.paymentType)?.label ?? invoice.paymentType}</p>
            {invoice.reference && <p><span className="text-muted-foreground">e-NCF modificado: </span><span className="font-mono">{invoice.reference.modifiedNcf}</span></p>}
          </div>
        </section>

        <ItemsTable items={invoice.items} print className="py-4" />

        <section className="grid gap-6 border-t pt-6 sm:grid-cols-[1fr_300px]">
          <div className="flex gap-4">
            <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/40 p-2 text-center" aria-label="Espacio del código QR">
              <QrCode className="h-8 w-8 text-muted-foreground" aria-hidden />
              <span className="text-[10px] leading-tight text-muted-foreground">Código QR generado por el backend</span>
            </div>
            <div className="min-w-0 space-y-2 text-xs">
              <p><span className="text-muted-foreground">Código de seguridad: </span><span className="font-mono font-semibold">{invoice.securityCode ?? 'Pendiente'}</span></p>
              <p><span className="text-muted-foreground">Fecha de firma: </span>{invoice.signedAt ? formatDateTime(invoice.signedAt) : 'Pendiente'}</p>
              <div>
                <p className="text-muted-foreground">URL de verificación</p>
                {verificationUrl ? (
                  <div className="flex items-center gap-1">
                    <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-brand hover:underline">{verificationUrl}</a>
                    <CopyButton value={verificationUrl} label="Copiar URL" className="print:hidden" />
                    <Button asChild variant="ghost" size="icon-sm" className="print:hidden">
                      <a href={verificationUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir URL de verificación"><ExternalLink /></a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Disponible cuando el backend firme el comprobante.</p>
                )}
              </div>
            </div>
          </div>
          <TotalsList values={detailTotals(invoice)} />
        </section>
      </article>
    </div>
  );
}
