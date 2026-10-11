import { useNavigate } from 'react-router-dom';
import { Eye, FileCode2, FileDown, FileMinus2, History, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';
import type { InvoiceSummary } from '@/types/ecf';
import { canCreateNoteFor, noteRoute } from '../../lib/invoice-routes';

interface Props {
  invoice: InvoiceSummary;
  canEmit: boolean;
  onDownload: (inv: InvoiceSummary, kind: 'pdf' | 'xml') => void;
  onCheckStatus: (inv: InvoiceSummary) => void;
}

export function InvoiceRowActions({ invoice, canEmit, onDownload, onCheckStatus }: Props) {
  const navigate = useNavigate();
  const detail = ROUTES.app.invoice(invoice.id);
  const noteAllowed = canEmit && canCreateNoteFor(invoice);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${invoice.encf}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">{invoice.encf}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => navigate(detail)}>
            <Eye className="mr-2 h-4 w-4" /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDownload(invoice, 'pdf')}>
            <FileDown className="mr-2 h-4 w-4" /> Descargar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDownload(invoice, 'xml')}>
            <FileCode2 className="mr-2 h-4 w-4" /> Descargar XML
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onCheckStatus(invoice)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Consultar estado DGII
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {noteAllowed && (
            <DropdownMenuItem onSelect={() => navigate(noteRoute('E34', invoice.id))}>
              <FileMinus2 className="mr-2 h-4 w-4" /> Nota de crédito
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => navigate(`${detail}?tab=historial`)}>
            <History className="mr-2 h-4 w-4" /> Historial
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
