import { Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ServiceInvoice, SubscriptionPayment } from '@/types/account';
import { saveBlob } from '@/utils/download';
import { formatDate, formatMoney } from '@/utils/format';
import { INVOICE_STATUS } from './subscription-utils';

interface Props {
  data?: ServiceInvoice[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

/**
 * El contrato actual de billingService no expone la descarga del documento de servicio.
 * Se genera un resumen local con los datos recibidos, identificado como tal.
 */
function downloadSummary(inv: ServiceInvoice) {
  const status = INVOICE_STATUS[inv.status]?.label ?? inv.status;
  const content = [
    'LoadExpress, S.R.L. — LX e-CF',
    'Resumen de factura de servicio',
    '',
    `Número: ${inv.number}`,
    `Fecha: ${formatDate(inv.date)}`,
    `Concepto: ${inv.concept}`,
    `Monto: ${formatMoney(inv.amount)}`,
    `Estado: ${status}`,
    '',
    'Este resumen no sustituye el comprobante fiscal emitido por LoadExpress.',
  ].join('\n');
  saveBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), `${inv.number}.txt`);
  toast.success('Resumen descargado');
}

function Status({ s }: { s: string }) {
  const m = INVOICE_STATUS[s] ?? { label: s, tone: 'neutral' as const };
  return <StatusBadge label={m.label} tone={m.tone} />;
}

export function ServiceInvoicesTable({ data, isLoading, error, onRetry }: Props) {
  if (isLoading) return <div className="p-5"><LoadingState rows={4} /></div>;
  if (error) return <ErrorState compact error={error} onRetry={onRetry} />;
  if (!data?.length) return <EmptyState compact icon={Receipt} title="Sin facturas de servicio" description="Aquí verás las facturas que LX emite por tu suscripción." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead className="hidden sm:table-cell">Concepto</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead><span className="sr-only">Descargar</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-mono text-xs font-medium">{inv.number}</TableCell>
            <TableCell className="hidden max-w-[280px] truncate text-muted-foreground sm:table-cell">{inv.concept}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(inv.date)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(inv.amount)}</TableCell>
            <TableCell><Status s={inv.status} /></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon-sm" onClick={() => downloadSummary(inv)} aria-label={`Descargar ${inv.number}`}><Download /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PaymentHistoryTable({ data, isLoading, error, onRetry }: Omit<Props, 'data'> & { data?: SubscriptionPayment[] }) {
  if (isLoading) return <div className="p-5"><LoadingState rows={3} /></div>;
  if (error) return <ErrorState compact error={error} onRetry={onRetry} />;
  if (!data?.length) return <EmptyState compact icon={Receipt} title="Sin operaciones registradas" description="Los depósitos aprobados aparecerán aquí." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Referencia</TableHead>
          <TableHead className="hidden sm:table-cell">Método</TableHead>
          <TableHead className="text-right">Tipo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell>
            <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">{payment.method}</TableCell>
            <TableCell className="text-right">{payment.simulated ? 'Simulado · sin cobro' : 'Registrado'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
