import { Database, Landmark, Loader2, RefreshCw } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { DgiiStatusBadge, InternalStatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import type { InvoiceDetail, TrackStatusResult } from '@/types/ecf';
import { formatDateTime } from '@/utils/format';
import { DgiiMessages } from '../DgiiMessages';
import { canCheckDgiiStatus, isRfce } from '../../lib/invoice-routes';

interface Props {
  invoice: InvoiceDetail;
  lastCheck: TrackStatusResult | null;
  checking: boolean;
  onCheckStatus: () => void;
}

export function DgiiTab({ invoice, lastCheck, checking, onCheckStatus }: Props) {
  const dgiiStatus = lastCheck?.dgiiStatus ?? invoice.dgiiStatus;
  const messages = lastCheck?.messages ?? invoice.dgiiMessages;
  const trackId = lastCheck?.trackId && lastCheck.trackId !== '—' ? lastCheck.trackId : invoice.trackId;
  const canCheck = canCheckDgiiStatus(invoice);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold">Estado interno</h2>
          </div>
          <InternalStatusBadge status={invoice.internalStatus} />
          <p className="mt-3 text-sm text-muted-foreground">
            Indica cómo quedó registrado el comprobante en LX e-CF (creación, firma y procesamiento). No equivale a la respuesta de la DGII.
          </p>
        </section>
        <section className="surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-brand" aria-hidden />
            <h2 className="text-sm font-semibold">Estado en la DGII</h2>
          </div>
          <DgiiStatusBadge status={dgiiStatus} />
          <p className="mt-3 text-sm text-muted-foreground">
            Es la respuesta oficial del servicio de recepción de la DGII. Solo se considera aceptado cuando la DGII lo informa.
          </p>
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <dl className="grid flex-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">TrackId</dt>
              <dd className="flex items-center gap-1">
                {trackId ? (
                  <>
                    <span className="break-all font-mono text-xs font-semibold">{trackId}</span>
                    <CopyButton value={trackId} label="Copiar trackId" />
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    {isRfce(invoice) && canCheck
                      ? 'La API no guardó un Track ID para este envío. Consulta el estado con el e-NCF y código de seguridad.'
                      : invoice.internalStatus === 'ENVIANDO' || invoice.internalStatus === 'ENVIO_INCIERTO'
                        ? 'Envío pendiente de confirmación: aún no hay un Track ID guardado.'
                      : 'Sin TrackId: el comprobante no ha sido enviado.'}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Última consulta</dt>
              <dd>{lastCheck ? formatDateTime(lastCheck.checkedAt) : 'No consultado en esta sesión'}</dd>
            </div>
          </dl>
          <Button variant="outline" onClick={onCheckStatus} disabled={checking || !canCheck}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />} Consultar estado
          </Button>
        </div>
        <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          La consulta es manual y no se repite automáticamente. Si el estado sigue en proceso, vuelve a consultar más tarde.
        </p>
      </section>

      <section className="surface p-5" aria-labelledby="dgii-msgs">
        <h2 id="dgii-msgs" className="mb-3 font-semibold">Mensajes de la DGII</h2>
        <DgiiMessages messages={messages} tone={dgiiStatus === 'RECHAZADO' ? 'danger' : 'warning'} emptyText="No hay mensajes registrados para este comprobante." />
      </section>
    </div>
  );
}
