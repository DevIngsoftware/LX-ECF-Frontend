import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Building2, CheckCircle2, CreditCard, FileText, Wallet } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ErrorState } from '@/components/shared/states';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { formatMoney, formatNumber } from '@/utils/format';
import { GrowthChart, PlanDistributionChart } from '../components/AdminCharts';
import { RecentActivity } from '../components/RecentActivity';

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.admin.dashboard, queryFn: () => adminService.dashboard() });

  const kpis = [
    { label: 'Empresas', value: formatNumber(data?.companies ?? 0), icon: Building2, tone: 'brand' as const, hint: `${formatNumber(data?.activeCompanies ?? 0)} activas` },
    { label: 'Suscripciones activas', value: formatNumber(data?.activeSubscriptions ?? 0), icon: CreditCard, tone: 'success' as const },
    { label: 'Documentos procesados', value: formatNumber(data?.documentsProcessed ?? 0), icon: FileText, tone: 'info' as const, hint: 'Mes actual' },
    { label: 'Solicitudes de API', value: formatNumber(data?.apiRequests ?? 0), icon: Activity, tone: 'neutral' as const },
    {
      label: 'Ingresos por suscripciones',
      value: data && data.subscriptionRevenue > 0 ? formatMoney(data.subscriptionRevenue) : 'Sin datos',
      icon: Wallet,
      tone: 'success' as const,
      hint: 'Según facturación registrada',
    },
    {
      label: 'Incidencias abiertas',
      value: formatNumber(data?.openIncidents ?? 0),
      icon: data?.openIncidents ? AlertTriangle : CheckCircle2,
      tone: data?.openIncidents ? ('warning' as const) : ('success' as const),
      hint: 'Tickets abiertos o en progreso',
    },
  ];

  return (
    <PageTransition>
      <PageHeader eyebrow="Administración" title="Dashboard global" description="Indicadores generales de la plataforma LX e-CF." />

      {error ? (
        <div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k, i) => (
              <StatCard key={k.label} index={i} label={k.label} value={k.value} icon={k.icon} tone={k.tone} hint={k.hint} loading={isLoading} />
            ))}
          </div>
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GrowthChart data={data?.trend ?? []} loading={isLoading} />
            </div>
            <PlanDistributionChart data={data?.planDistribution ?? []} loading={isLoading} />
          </div>
        </>
      )}

      <RecentActivity />
    </PageTransition>
  );
}
