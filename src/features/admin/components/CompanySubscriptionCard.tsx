import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import type { AdminCompany } from '@/types/platform';
import { formatDate } from '@/utils/format';

export function CompanySubscriptionCard({ company }: { company: AdminCompany }) {
  return (
    <section className="surface p-5" aria-labelledby="sub-title">
      <h2 id="sub-title" className="mb-4 font-semibold">Suscripción</h2>
      {!company.subscriptionStatus ? (
        <EmptyState compact icon={CreditCard} title="Sin suscripción registrada"
          description="Editar un plan no asigna ese plan a la empresa. Debe activarse una suscripción antes de habilitar módulos." />
      ) : (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Plan</dt>
            <dd className="mt-1 font-medium">{company.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd className="mt-1"><GenericStatusBadge status={company.subscriptionStatus} /></dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Renovación</dt>
            <dd className="mt-1">{formatDate(company.renewalDate ?? undefined)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
