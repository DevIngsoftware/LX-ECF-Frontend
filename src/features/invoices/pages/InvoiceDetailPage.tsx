import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileSearch } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState, StateView } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage, toApiError } from '@/services/http/errors';
import type { TrackStatusResult } from '@/types/ecf';
import { EventTimeline } from '../components/EventTimeline';
import { DetailHeader } from '../components/detail/DetailHeader';
import { DgiiTab } from '../components/detail/DgiiTab';
import { DocumentTab, PRINT_STYLES } from '../components/detail/DocumentTab';
import { OfficialDocumentTab } from '../components/detail/OfficialDocumentTab';
import { ENV } from '@/constants/env';
import { SummaryTab } from '../components/detail/SummaryTab';
import { isDetailTab, type DetailTab } from '../lib/invoice-routes';
import { useCheckStatus, useInvoiceDownloads } from '../lib/use-invoice-actions';

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando comprobante">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-6 w-96 max-w-full" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function InvoiceDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [lastCheck, setLastCheck] = useState<TrackStatusResult | null>(null);
  const [printToken, setPrintToken] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const downloads = useInvoiceDownloads();
  const check = useCheckStatus(setLastCheck);
  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: (invoiceId: string) => invoicesService.send(invoiceId),
    retry: false,
    onSuccess: () => {
      setConfirmSend(false);
      toast.success('Comprobante enviado a la DGII');
      void qc.invalidateQueries({ queryKey: queryKeys.invoice(id) });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: () => invoicesService.delete(id),
    onSuccess: () => {
      setConfirmDelete(false);
      toast.success('Comprobante eliminado');
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      navigate(ROUTES.app.invoices);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rawTab = params.get('tab');
  const tab: DetailTab = isDetailTab(rawTab) ? rawTab : 'resumen';
  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    if (t === 'resumen') next.delete('tab');
    else next.set('tab', t);
    setParams(next, { replace: true });
  };

  const { data: invoice, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => invoicesService.get(id),
    enabled: !!id,
  });

  if (isLoading) return <DetailSkeleton />;
  if (error || !invoice) {
    if (toApiError(error).kind === 'not_found') {
      return (
        <StateView
          icon={FileSearch}
          title="Comprobante no encontrado"
          description="Es posible que el enlace sea incorrecto o que no tengas acceso a este comprobante."
          action={<Button asChild variant="outline"><Link to={ROUTES.app.invoices}>Volver a comprobantes</Link></Button>}
        />
      );
    }
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const onDownload = (kind: 'pdf' | 'xml') => void downloads.download(invoice.id, kind, invoice.encf);
  const onCheckStatus = () => check.mutate(invoice.id);
  const onPrint = () => {
    if (tab !== 'documento') setTab('documento');
    if (ENV.invoicesUseMocks) window.setTimeout(() => window.print(), tab === 'documento' ? 0 : 400);
    else setPrintToken((value) => value + 1);
  };

  return (
    <PageTransition>
      {ENV.invoicesUseMocks && <style>{PRINT_STYLES}</style>}
      <DetailHeader
        invoice={invoice}
        canEmit={hasPermission('invoices.emit')}
        downloading={{ pdf: downloads.isBusy(invoice.id, 'pdf'), xml: downloads.isBusy(invoice.id, 'xml') }}
        checking={check.isPending}
        onDownload={onDownload}
        onCheckStatus={onCheckStatus}
        onPrint={onPrint}
        onSend={() => setConfirmSend(true)}
        sending={send.isPending}
        onDelete={() => setConfirmDelete(true)}
      />
      <ConfirmDialog open={confirmSend} onOpenChange={(open) => !send.isPending && setConfirmSend(open)}
        title="Enviar comprobante a la DGII"
        description={`Confirma que revisaste el PDF de ${invoice.encf}. Al iniciar el envío ya no podrás editar ni eliminar este comprobante.`}
        confirmLabel="Enviar a la DGII" loading={send.isPending} onConfirm={() => send.mutate(invoice.id)} />
      <ConfirmDialog open={confirmDelete} onOpenChange={(open) => !remove.isPending && setConfirmDelete(open)}
        title="Eliminar comprobante" description={`Se eliminará ${invoice.encf} y sus líneas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar comprobante" destructive loading={remove.isPending} onConfirm={() => remove.mutate()} />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="scrollbar-thin -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-11">
            <TabsTrigger value="resumen" className="px-4">Resumen</TabsTrigger>
            <TabsTrigger value="documento" className="px-4">Documento</TabsTrigger>
            <TabsTrigger value="estado" className="px-4">Estado DGII</TabsTrigger>
            <TabsTrigger value="historial" className="px-4">Historial</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="resumen" className="mt-0">
          <SummaryTab invoice={invoice} />
        </TabsContent>
        <TabsContent value="documento" className="mt-0">
          {ENV.invoicesUseMocks ? <DocumentTab invoice={invoice} onDownload={onDownload} onPrint={onPrint} />
            : <OfficialDocumentTab invoice={invoice} onDownload={onDownload} printToken={printToken} />}
        </TabsContent>
        <TabsContent value="estado" className="mt-0">
          <DgiiTab invoice={invoice} lastCheck={lastCheck} checking={check.isPending} onCheckStatus={onCheckStatus} />
        </TabsContent>
        <TabsContent value="historial" className="mt-0">
          <section className="surface p-5 sm:p-6" aria-labelledby="hist-title">
            <h2 id="hist-title" className="mb-4 font-semibold">Historial del comprobante</h2>
            <EventTimeline events={[...invoice.history].reverse()} />
          </section>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
