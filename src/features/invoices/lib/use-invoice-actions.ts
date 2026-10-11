import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DGII_STATUS_META } from '@/constants/ecf';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { TrackStatusResult } from '@/types/ecf';
import { saveBlob } from '@/utils/download';

export type DownloadKind = 'pdf' | 'xml';

/** Descargas de representación impresa (PDF) y XML firmado. */
export function useInvoiceDownloads() {
  const [busy, setBusy] = useState<string | null>(null);

  const download = useCallback(async (id: string, kind: DownloadKind, encf?: string) => {
    const key = `${id}:${kind}`;
    setBusy(key);
    try {
      const blob = kind === 'pdf' ? await invoicesService.downloadPdf(id) : await invoicesService.downloadXml(id);
      saveBlob(blob, `${encf ?? id}.${kind}`);
      toast.success(kind === 'pdf' ? 'PDF descargado' : 'XML descargado');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }, []);

  const isBusy = (id: string, kind: DownloadKind) => busy === `${id}:${kind}`;
  return { download, isBusy, busy: busy !== null };
}

export const dgiiStatusLabel = (status?: string) => DGII_STATUS_META[status ?? 'NO_ENVIADO']?.label ?? status ?? 'No enviado';

/** Consulta manual del estado en la DGII. Nunca se reintenta automáticamente. */
export function useCheckStatus(onResult?: (r: TrackStatusResult) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesService.checkStatus(id),
    retry: false,
    onSuccess: (r, id) => {
      toast.info(`Estado DGII: ${dgiiStatusLabel(r.dgiiStatus)}`);
      void qc.invalidateQueries({ queryKey: queryKeys.invoice(id) });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: queryKeys.dgii });
      onResult?.(r);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
