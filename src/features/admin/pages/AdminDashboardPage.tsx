import { useQuery } from '@tanstack/react-query';
import { Building2, FileText, Settings2 } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { formatNumber } from '@/utils/format';
import { GrowthChart } from '../components/AdminCharts';

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.admin.dashboard, queryFn: () => adminService.dashboard() });

  const kpis = [
    { label: 'Empresas registradas', value: formatNumber(data?.companies ?? 0), icon: Building2, tone: 'brand' as const },
    { label: 'Configuración completada', value: formatNumber(data?.configuredCompanies ?? 0), icon: Settings2, tone: 'success' as const, hint: 'Empresas que completaron el asistente' },
    { label: 'Comprobantes registrados', value: formatNumber(data?.documentsThisMonth ?? 0), icon: FileText, tone: 'info' as const, hint: 'Mes actual' },
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
          <GrowthChart data={data?.trend ?? []} loading={isLoading} />
        </>
      )}
      <div className="mt-6 surface p-5">
        <EmptyState compact title="Otros módulos pendientes" description="Los planes, suscripciones, pagos, solicitudes de API, incidencias y auditoría aún no están conectados a la API." />
      </div>
    </PageTransition>
  );
}
