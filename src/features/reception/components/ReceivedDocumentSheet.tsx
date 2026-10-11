import type { ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, FileCode2, FileText, Info, Loader2, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CopyButton } from '@/components/shared/CopyButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import { receptionService } from '@/services/api/operations';
import { errorMessage } from '@/services/http/errors';
import type { ReceivedDocument } from '@/types/business';
import { saveBlob } from '@/utils/download';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import { receptionStatusMeta } from './reception-meta';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

interface ReceivedDocumentSheetProps {
  doc: ReceivedDocument | null;
  onOpenChange: (open: boolean) => void;
}

export function ReceivedDocumentSheet({ doc, onOpenChange }: ReceivedDocumentSheetProps) {
  const xml = useMutation({
    mutationFn: (d: ReceivedDocument) => receptionService.downloadXml(d.id),
    onSuccess: (blob, d) => {
      saveBlob(blob, `${d.encf}.xml`);
      toast.success('XML descargado');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const meta = doc ? receptionStatusMeta(String(doc.status)) : null;
  const subtotal = doc && doc.itbis != null ? doc.total - doc.itbis : null;

  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {doc && meta && (
          <>
            <SheetHeader className="border-b p-6 text-left">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{doc.type}</Badge>
                <StatusBadge label={meta.label} tone={meta.tone} />
              </div>
              <SheetTitle className="flex items-center gap-1 font-mono text-lg">
                {doc.encf}
                <CopyButton value={doc.encf} label="Copiar e-NCF" />
              </SheetTitle>
              <SheetDescription>{ECF_TYPE_MAP[doc.type]?.name ?? 'Comprobante electrónico'} recibido de proveedor.</SheetDescription>
            </SheetHeader>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emisor</h3>
                <Row label="Proveedor">{doc.supplierName}</Row>
                <Row label="RNC"><span className="font-mono">{doc.supplierRnc}</span></Row>
              </section>
              <Separator />
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fechas</h3>
                <Row label="Emisión">{formatDate(doc.issueDate)}</Row>
                <Row label="Recepción">{formatDateTime(doc.receivedAt)}</Row>
              </section>
              <Separator />
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Montos</h3>
                <Row label="Subtotal"><span className="tabular-nums">{subtotal == null ? '—' : formatMoney(subtotal)}</span></Row>
                <Row label="ITBIS"><span className="tabular-nums">{doc.itbis == null ? '—' : formatMoney(doc.itbis)}</span></Row>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="font-display text-lg font-bold tabular-nums">{formatMoney(doc.total)}</span>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archivos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => xml.mutate(doc)} disabled={xml.isPending}>
                    {xml.isPending ? <Loader2 className="animate-spin" /> : <FileCode2 />} XML
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button variant="outline" className="w-full" disabled>
                          <FileText /> PDF
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{doc.hasPdf ? 'Descarga de PDF disponible cuando el backend lo habilite' : 'El proveedor no adjuntó representación impresa'}</TooltipContent>
                  </Tooltip>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border p-4">
                <div>
                  <h3 className="font-semibold">Aprobación comercial</h3>
                  <p className="text-xs text-muted-foreground">Acepta o rechaza comercialmente el comprobante recibido ante el emisor.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled><CheckCircle2 /> Aceptar</Button>
                  <Button variant="outline" disabled><XCircle /> Rechazar</Button>
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Disponible cuando el backend habilite el servicio de aprobación comercial.
                </p>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
