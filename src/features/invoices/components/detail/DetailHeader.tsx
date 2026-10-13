import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, FileCode2, FileDown, FileMinus2, FilePlus2, Loader2, Pencil, Printer, RefreshCw, Send, Trash2 } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { DgiiStatusBadge, InternalStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import { ENV } from '@/constants/env';
import { ROUTES } from '@/constants/routes';
import type { InvoiceDetail } from '@/types/ecf';
import { formatDate, formatMoney } from '@/utils/format';
import { EcfTypeTag } from '../EcfTypeTag';
import { canCheckDgiiStatus, canCreateNoteFor, canEditUnsentInvoice, noteRoute } from '../../lib/invoice-routes';

interface Props {
  invoice: InvoiceDetail;
  canEmit: boolean;
  downloading: { pdf: boolean; xml: boolean };
  checking: boolean;
  onDownload: (kind: 'pdf' | 'xml') => void;
  onCheckStatus: () => void;
  onPrint: () => void;
  onSend: () => void;
  sending: boolean;
  onDelete: () => void;
}

export function DetailHeader({ invoice, canEmit, downloading, checking, onDownload, onCheckStatus, onPrint, onSend, sending, onDelete }: Props) {
  const notesAllowed = canEmit && canCreateNoteFor(invoice);
  const editable = !ENV.invoicesUseMocks && canEmit && canEditUnsentInvoice(invoice);
  return (
    <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6 space-y-4">
      <Link to={ROUTES.app.invoices} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Comprobantes
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <EcfTypeTag type={invoice.type} showName={false} />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{ECF_TYPE_MAP[invoice.type]?.name ?? invoice.type}</p>
          <div className="flex items-center gap-1">
            <h1 className="break-all font-mono text-2xl font-bold sm:text-3xl">{invoice.encf}</h1>
            <CopyButton value={invoice.encf} label="Copiar e-NCF" />
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.buyerName} · {formatDate(invoice.issueDate)} · <span className="font-semibold text-foreground tabular-nums">{formatMoney(invoice.total)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Interno</span>
            <InternalStatusBadge status={invoice.internalStatus} />
            <span className="ml-1 text-xs text-muted-foreground">DGII</span>
            <DgiiStatusBadge status={invoice.dgiiStatus} />
            {invoice.paymentStatus && (
              <>
                <span className="ml-1 text-xs text-muted-foreground">Cobro</span>
                <PaymentStatusBadge status={invoice.paymentStatus} />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editable && <>
            <Button asChild variant="outline" size="sm"><Link to={`${ROUTES.app.newInvoice}?editar=${encodeURIComponent(invoice.id)}`}><Pencil /> Editar</Link></Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 /> Eliminar</Button>
          </>}
          {!ENV.invoicesUseMocks && canEmit && invoice.dgiiStatus === 'NO_ENVIADO'
            && (invoice.internalStatus === 'CREADO' || invoice.internalStatus === 'XML_GENERADO') && (
            <Button size="sm" onClick={onSend} disabled={sending}>
              {sending ? <Loader2 className="animate-spin" /> : <Send />} Enviar a DGII
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onDownload('pdf')} disabled={downloading.pdf}>
            {downloading.pdf ? <Loader2 className="animate-spin" /> : <FileDown />} PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownload('xml')} disabled={downloading.xml || (!ENV.invoicesUseMocks && !invoice.signedAt)}>
            {downloading.xml ? <Loader2 className="animate-spin" /> : <FileCode2 />} XML
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={onCheckStatus} disabled={checking || (!ENV.invoicesUseMocks && !canCheckDgiiStatus(invoice))}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />} Consultar estado
          </Button>
          {notesAllowed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  Emitir nota <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={noteRoute('E34', invoice.id)}><FileMinus2 className="mr-2 h-4 w-4" /> Nota de crédito (E34)</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={noteRoute('E33', invoice.id)}><FilePlus2 className="mr-2 h-4 w-4" /> Nota de débito (E33)</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}
