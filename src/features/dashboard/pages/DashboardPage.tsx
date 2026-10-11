import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, FilePlus2, FileText, Receipt, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { rangeFromPreset } from '@/utils/dates';
import { formatDate, formatMoney, formatNumber } from '@/utils/format';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';

export function DashboardPage() {
  const [range] = useState(() => rangeFromPreset('month'));
  const summary = useQuery({ queryKey: queryKeys.dashboard(range), queryFn: () => invoicesService.dashboard(range) });
  const recent = useQuery({ queryKey: queryKeys.invoices({ page: 0, size: 5 }), queryFn: () => invoicesService.list({ page: 0, size: 5 }) });
  const data = summary.data;

  return (
    <PageTransition>
      <PageHeader eyebrow="Resumen" title="Dashboard" description="Actividad de facturación y estado de tus comprobantes este mes."
        actions={<Button asChild><Link to={ROUTES.app.newInvoice}><FilePlus2 /> Nueva factura</Link></Button>} />
      {summary.error ? <ErrorState error={summary.error} onRetry={() => void summary.refetch()} /> : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Facturado" value={formatMoney(data?.totalInvoiced ?? 0)} icon={Wallet} tone="brand" loading={summary.isLoading} />
          <StatCard label="Comprobantes" value={formatNumber(data?.invoicesIssued ?? 0)} icon={FileText} tone="info" loading={summary.isLoading} />
          <StatCard label="Aceptados" value={formatNumber(data?.accepted ?? 0)} icon={CheckCircle2} tone="success" loading={summary.isLoading} />
          <StatCard label="Pendientes" value={formatNumber(data?.pending ?? 0)} icon={Clock3} tone="warning" loading={summary.isLoading} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2" aria-labelledby="recent-title">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 id="recent-title" className="font-semibold">Comprobantes recientes</h2><Button asChild variant="link" size="sm"><Link to={ROUTES.app.invoices}>Ver todos</Link></Button></div>
          {recent.isLoading ? <LoadingState rows={5} /> : recent.error ? <ErrorState compact error={recent.error} onRetry={() => void recent.refetch()} /> : !recent.data?.content.length ? (
            <EmptyState compact icon={Receipt} title="Sin comprobantes" description="Los comprobantes aparecerán aquí cuando se creen." />
          ) : <ul className="divide-y">{recent.data.content.map((invoice) => <li key={invoice.id}>
            <Link to={ROUTES.app.invoice(invoice.id)} className="flex items-center justify-between gap-3 py-3 hover:text-brand">
              <span className="min-w-0"><span className="block truncate font-medium">{invoice.buyerName}</span><span className="text-xs text-muted-foreground">{invoice.encf} · {formatDate(invoice.issueDate)}</span></span>
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(invoice.total)}</span>
            </Link>
          </li>)}</ul>}
        </section>
        <section className="surface p-5" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="mb-4 font-semibold">Alertas</h2>
          {summary.isLoading ? <LoadingState rows={3} /> : !data?.alerts.length ? <EmptyState compact icon={CheckCircle2} title="Todo al día" description="No hay alertas pendientes." /> : (
            <ul className="space-y-3">{data.alerts.map((alert) => <li key={alert.id} className="rounded-lg border p-3 text-sm">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-warning" />{alert.title}</p>
              <p className="mt-1 text-muted-foreground">{alert.description}</p>
              {alert.link && <Link to={alert.link} className="mt-2 inline-block font-medium text-brand hover:underline">Ver detalle</Link>}
            </li>)}</ul>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
