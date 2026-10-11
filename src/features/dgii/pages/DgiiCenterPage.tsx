import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, FileKey2, Hash, Search, ShieldCheck } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { EventTimeline } from '@/features/invoices/components/EventTimeline';
import { DgiiMessages } from '@/features/invoices/components/DgiiMessages';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { formatDate, formatMoney, formatNumber } from '@/utils/format';

export function DgiiCenterPage() {
  const [trackId, setTrackId] = useState('');
  const overview = useQuery({ queryKey: queryKeys.dgii, queryFn: invoicesService.dgiiOverview });
  const tracking = useMutation({ mutationFn: (id: string) => invoicesService.track(id) });
  const check = (event: FormEvent) => { event.preventDefault(); if (trackId.trim()) tracking.mutate(trackId.trim()); };
  const data = overview.data;

  return <PageTransition>
    <PageHeader eyebrow="Facturación electrónica" title="Centro DGII" description="Consulta el ambiente, las secuencias y los eventos de tus comprobantes."
      actions={<Button asChild variant="outline"><Link to={ROUTES.app.certification}><ShieldCheck /> Certificación</Link></Button>} />
    {overview.error ? <ErrorState error={overview.error} onRetry={() => void overview.refetch()} /> : <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Ambiente" value={data?.environment ?? 'Sin configurar'} icon={ShieldCheck} tone="brand" loading={overview.isLoading} />
        <StatCard label="Secuencias" value={formatNumber(data?.sequences.length ?? 0)} icon={Hash} tone="info" loading={overview.isLoading} />
        <StatCard label="Eventos recientes" value={formatNumber(data?.events.length ?? 0)} icon={Activity} tone="neutral" loading={overview.isLoading} />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="certificate-title">
          <h2 id="certificate-title" className="mb-4 flex items-center gap-2 font-semibold"><FileKey2 className="h-4 w-4" /> Certificado digital</h2>
          {overview.isLoading ? <LoadingState rows={3} /> : data?.certificate ? <dl className="space-y-2 text-sm"><div><dt className="text-muted-foreground">Titular</dt><dd className="font-medium">{data.certificate.subject}</dd></div><div><dt className="text-muted-foreground">Emisor</dt><dd>{data.certificate.issuer}</dd></div><div><dt className="text-muted-foreground">Vence</dt><dd>{formatDate(data.certificate.validTo)}</dd></div></dl> : <EmptyState compact icon={FileKey2} title="Certificado pendiente" description="Carga un certificado desde la configuración inicial." />}
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to={ROUTES.app.onboarding}>Ir a configuración</Link></Button>
        </section>
        <section className="surface p-5" aria-labelledby="tracking-title">
          <h2 id="tracking-title" className="mb-2 font-semibold">Consultar trackId</h2>
          <p className="mb-4 text-sm text-muted-foreground">Busca el estado de un envío registrado.</p>
          <form onSubmit={check} className="flex gap-2"><Input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="Ingresa el trackId" aria-label="Track ID" /><Button type="submit" disabled={!trackId.trim() || tracking.isPending}><Search /> Consultar</Button></form>
          {tracking.error && <p role="alert" className="mt-3 text-sm text-destructive">{errorMessage(tracking.error)}</p>}
          {tracking.data && <div className="mt-4 space-y-3"><p className="text-sm">Estado: <strong>{tracking.data.dgiiStatus}</strong></p><DgiiMessages messages={tracking.data.messages} tone="info" /></div>}
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="sequences-title"><div className="mb-4 flex items-center justify-between"><h2 id="sequences-title" className="font-semibold">Secuencias e-NCF</h2><Button asChild variant="link" size="sm"><Link to={ROUTES.app.settingsSection('secuencias')}>Ver detalle</Link></Button></div>
          {overview.isLoading ? <LoadingState rows={4} /> : !data?.sequences.length ? <EmptyState compact icon={Hash} title="Sin secuencias" /> : <ul className="divide-y">{data.sequences.map((sequence) => <li key={sequence.type} className="flex justify-between gap-3 py-3 text-sm"><span className="font-mono font-medium">{sequence.type}</span><span>{formatNumber(sequence.remaining)} disponibles</span></li>)}</ul>}
        </section>
        <section className="surface p-5" aria-labelledby="events-title"><h2 id="events-title" className="mb-4 font-semibold">Eventos recientes</h2>{overview.isLoading ? <LoadingState rows={4} /> : <EventTimeline events={data?.events ?? []} />}</section>
      </div>
      {!!data?.recentRejections?.length && (
        <section className="surface mt-6 overflow-hidden" aria-labelledby="rejections-title">
          <div className="flex items-center gap-2 border-b p-5">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
            <h2 id="rejections-title" className="font-semibold">Comprobantes rechazados</h2>
          </div>
          <ul className="divide-y">
            {data.recentRejections.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-mono font-medium">{invoice.encf}</p>
                  <p className="text-xs text-muted-foreground">{invoice.buyerName} · {formatDate(invoice.issueDate)} · {formatMoney(invoice.total)}</p>
                </div>
                <Button asChild variant="outline" size="sm"><Link to={ROUTES.app.invoice(invoice.id)}>Ver motivo</Link></Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>}
  </PageTransition>;
}
