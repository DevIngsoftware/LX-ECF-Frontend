import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { AdminCompany } from '@/types/platform';
import { daysUntil, formatDate, formatMoney } from '@/utils/format';

/** No hay endpoint de suscripción por empresa: se busca por nombre en el listado. */
export function CompanySubscriptionCard({ company }: { company: AdminCompany }) {
  const query = { page: 0, size: 5, search: company.name };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.subscriptions(query),
    queryFn: () => adminService.subscriptions(query),
  });
  const sub = data?.content.find((s) => s.company === company.name);
  const days = sub ? daysUntil(sub.renewalDate) : 0;

  return (
    <section className="surface p-5" aria-labelledby="sub-title">
      <h2 id="sub-title" className="mb-4 font-semibold">Suscripción</h2>
      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState compact error={error} onRetry={() => void refetch()} />
      ) : !sub ? (
        <EmptyState compact icon={CreditCard} title="Sin suscripción registrada" />
      ) : (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="mt-0.5 font-medium">{sub.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd className="mt-0.5"><GenericStatusBadge status={sub.status} /></dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Renovación</dt>
            <dd className="mt-0.5 font-medium">{formatDate(sub.renewalDate)}</dd>
            <dd className={days < 0 ? 'text-xs text-destructive' : days <= 7 ? 'text-xs text-warning' : 'text-xs text-muted-foreground'}>
              {days < 0 ? `Vencida hace ${Math.abs(days)} día(s)` : `En ${days} día(s)`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Último pago</dt>
            <dd className="mt-0.5 font-medium">{formatDate(sub.lastPaymentAt)}</dd>
            <dd className="text-xs text-muted-foreground">{sub.amount > 0 ? formatMoney(sub.amount) : 'Monto no disponible'}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
