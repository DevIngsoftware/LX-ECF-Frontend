import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Blocks } from 'lucide-react';
import { PageTransition, Reveal } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { billingService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { CurrentPlanCard } from '../components/CurrentPlanCard';
import { PlanComparison } from '../components/PlanComparison';
import { PaymentHistoryTable, ServiceInvoicesTable } from '../components/BillingHistory';
import { PaymentMethodCard } from '../components/PaymentMethodCard';

export function SubscriptionPage() {
  const sub = useQuery({ queryKey: queryKeys.subscription, queryFn: billingService.subscription });
  const plans = useQuery({ queryKey: queryKeys.plans, queryFn: billingService.plans });
  const invoices = useQuery({ queryKey: queryKeys.serviceInvoices, queryFn: billingService.invoices });
  const retryInvoices = () => void invoices.refetch();

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Cuenta"
        title="Suscripción"
        description="Tu plan, consumo del período, facturas de servicio y opciones para cambiar de plan."
        actions={<Button asChild variant="outline"><Link to={ROUTES.app.modules}><Blocks /> Módulos</Link></Button>}
      />

      <div className="space-y-8">
        {sub.isLoading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : sub.error ? (
          <div className="surface"><ErrorState error={sub.error} onRetry={() => void sub.refetch()} /></div>
        ) : sub.data ? (
          <CurrentPlanCard sub={sub.data} />
        ) : null}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Comparar planes</h2>
            <p className="text-sm text-muted-foreground">Los precios se confirman con tu asesor según volumen y módulos.</p>
          </div>
          {plans.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-96 rounded-xl" />)}</div>
          ) : plans.error ? (
            <div className="surface"><ErrorState compact error={plans.error} onRetry={() => void plans.refetch()} /></div>
          ) : (
            <PlanComparison plans={plans.data ?? []} currentPlanId={sub.data?.planId} />
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Reveal y={12}>
            <section className="surface overflow-hidden">
              <div className="border-b p-5">
                <h2 className="font-semibold">Historial de pagos</h2>
                <p className="text-sm text-muted-foreground">Pagos de suscripción confirmados por LX.</p>
              </div>
              <PaymentHistoryTable data={invoices.data} isLoading={invoices.isLoading} error={invoices.error} onRetry={retryInvoices} />
            </section>
          </Reveal>
          <Reveal y={12} delay={0.05}>
            <PaymentMethodCard />
          </Reveal>
        </div>

        <Reveal y={12}>
          <section className="surface overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-semibold">Facturas de servicio LX</h2>
              <p className="text-sm text-muted-foreground">Facturas emitidas por LoadExpress, S.R.L. por el uso de la plataforma.</p>
            </div>
            <ServiceInvoicesTable data={invoices.data} isLoading={invoices.isLoading} error={invoices.error} onRetry={retryInvoices} />
          </section>
        </Reveal>
      </div>
    </PageTransition>
  );
}
