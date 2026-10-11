import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ScrollText } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { formatRelative } from '@/utils/format';

const QUERY = { page: 0, size: 6, sort: 'at', direction: 'desc' as const };

/** Actividad reciente basada en la bitácora de auditoría. */
export function RecentActivity() {
  const { hasPermission } = useAuth();
  const canAudit = hasPermission('admin.audit');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.audit(QUERY),
    queryFn: () => adminService.audit(QUERY),
    enabled: canAudit,
  });

  return (
    <section className="surface flex flex-col p-5" aria-labelledby="activity-title">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="activity-title" className="font-semibold">Actividad reciente</h2>
        {canAudit && (
          <Link to={ROUTES.admin.audit} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            Ver auditoría <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
      {!canAudit ? (
        <EmptyState compact icon={ScrollText} title="Sin acceso a la bitácora" description="Tu rol no permite consultar la auditoría." />
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState compact error={error} onRetry={() => void refetch()} />
      ) : !data?.content.length ? (
        <EmptyState compact icon={ScrollText} title="Sin actividad reciente" />
      ) : (
        <ol className="space-y-4">
          {data.content.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{e.action}</p>
                  <GenericStatusBadge status={e.category} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {e.actor} · {e.target}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(e.at)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
