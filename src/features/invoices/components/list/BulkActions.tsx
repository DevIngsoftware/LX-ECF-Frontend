import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileCode2, FileDown, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { InvoiceSummary } from '@/types/ecf';
import { saveBlob } from '@/utils/download';

type BulkOp = 'pdf' | 'xml' | 'status';

interface Props {
  ids: string[];
  lookup: (id: string) => InvoiceSummary | undefined;
  onClear: () => void;
}

/** Acciones masivas secuenciales: una solicitud a la vez, sin reintentos automáticos. */
export function BulkActions({ ids, lookup, onClear }: Props) {
  const qc = useQueryClient();
  const [running, setRunning] = useState<BulkOp | null>(null);
  const [progress, setProgress] = useState(0);

  const run = async (op: BulkOp) => {
    setRunning(op);
    setProgress(0);
    let ok = 0;
    let failed = 0;
    let lastError = '';
    for (const id of ids) {
      const encf = lookup(id)?.encf ?? id;
      try {
        if (op === 'status') await invoicesService.checkStatus(id);
        else saveBlob(op === 'pdf' ? await invoicesService.downloadPdf(id) : await invoicesService.downloadXml(id), `${encf}.${op}`);
        ok += 1;
      } catch (err) {
        failed += 1;
        lastError = errorMessage(err);
      }
      setProgress((p) => p + 1);
    }
    setRunning(null);
    if (op === 'status') {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: queryKeys.dgii });
    }
    const verb = op === 'status' ? 'consultado(s)' : 'descargado(s)';
    if (failed === 0) toast.success(`${ok} comprobante(s) ${verb}`);
    else toast.error(`${ok} ${verb}, ${failed} con error`, { description: lastError });
  };

  const btn = (op: BulkOp, label: string, Icon: typeof FileDown) => (
    <Button variant="outline" size="sm" onClick={() => void run(op)} disabled={running !== null}>
      {running === op ? <Loader2 className="animate-spin" /> : <Icon />}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {btn('pdf', 'PDF', FileDown)}
      {btn('xml', 'XML', FileCode2)}
      {btn('status', 'Consultar estado', RefreshCw)}
      {running && <span className="text-xs tabular-nums text-muted-foreground">{progress}/{ids.length}</span>}
      <Button variant="ghost" size="sm" onClick={onClear} disabled={running !== null}>
        <X /> Limpiar selección
      </Button>
    </div>
  );
}
