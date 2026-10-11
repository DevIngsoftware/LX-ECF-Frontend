import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCode2, FileDown, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/shared/states';
import { invoicesService } from '@/services/api/invoices';
import type { InvoiceDetail } from '@/types/ecf';

export function OfficialDocumentTab({ invoice, onDownload, printToken }: {
  invoice: InvoiceDetail;
  onDownload: (kind: 'pdf' | 'xml') => void;
  printToken: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const printed = useRef(0);
  const pdf = useQuery({ queryKey: ['invoice-pdf', invoice.id], queryFn: () => invoicesService.downloadPdf(invoice.id) });

  useEffect(() => {
    if (!pdf.data) return;
    const next = URL.createObjectURL(pdf.data);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [pdf.data]);

  useEffect(() => {
    if (loaded && printToken > printed.current) {
      printed.current = printToken;
      frame.current?.contentWindow?.print();
    }
  }, [loaded, printToken]);

  if (pdf.error) return <ErrorState error={pdf.error} onRetry={() => void pdf.refetch()} />;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => frame.current?.contentWindow?.print()} disabled={!loaded}><Printer /> Imprimir PDF</Button>
      <Button variant="outline" size="sm" onClick={() => onDownload('pdf')}><FileDown /> PDF</Button>
      <Button variant="outline" size="sm" onClick={() => onDownload('xml')}><FileCode2 /> XML</Button>
      <p className="text-xs text-muted-foreground sm:ml-auto">Representación generada por la API.</p>
    </div>
    {url ? <iframe ref={frame} title={`Representación PDF ${invoice.encf}`} src={url} onLoad={() => setLoaded(true)}
      className="h-[75vh] min-h-[600px] w-full rounded-xl border bg-white" />
      : <div role="status" className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando PDF…</div>}
  </div>;
}
