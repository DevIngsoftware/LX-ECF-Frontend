import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, MessageSquare } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { ENDPOINTS } from '@/services/api/endpoints';
import { queryKeys } from '@/services/api/query-keys';
import { get } from '@/services/http/client';
import type { ModuleKey, Plan } from '@/types/account';
import { cn } from '@/lib/utils';
import { formatPlanPrice } from '@/utils/format';
import { SectionHeading } from './SectionHeading';

const MODULE_LABELS: Record<ModuleKey, string> = {
  reception: 'Recepción de e-CF',
  receivables: 'Cuentas por cobrar',
  catalog: 'Catálogo de productos',
  advanced_reports: 'Reportes avanzados',
  api: 'API comercial',
  expenses: 'Gestión de gastos',
};

const BASE_FEATURES = ['Emisión de e-CF E31 a E47', 'Consulta de estados DGII', 'Clientes y proveedores', 'Reportes esenciales'];

function PlanCard({ plan }: { plan: Plan }) {
  const highlighted = Boolean(plan.highlighted);
  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-200',
        highlighted ? 'border-transparent bg-ink text-white shadow-elevated lg:-my-4 lg:py-11' : 'surface surface-hover',
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Recomendado</span>
      )}
      <h3 className={cn('text-xl font-extrabold', highlighted && 'text-white')}>{plan.name}</h3>
      <p className={cn('mt-2 min-h-[40px] text-sm', highlighted ? 'text-zinc-400' : 'text-muted-foreground')}>{plan.description}</p>
      <p className="mt-6 font-display text-3xl font-extrabold">{formatPlanPrice(plan.priceLabel)}</p>
      <p className={cn('mt-1 text-xs', highlighted ? 'text-zinc-400' : 'text-muted-foreground')}>
        {plan.userLimit ? `Hasta ${plan.userLimit} usuarios` : 'Usuarios según contrato'} · {plan.invoiceLimit ? `${plan.invoiceLimit} comprobantes/mes` : 'Volumen según necesidad'}
      </p>
      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {[...BASE_FEATURES, ...plan.modules.map((m) => MODULE_LABELS[m])].map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', highlighted ? 'text-brand' : 'text-success')} aria-hidden />
            <span className={highlighted ? 'text-zinc-200' : undefined}>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8 w-full" variant={highlighted ? 'default' : 'outline'}>
        <Link to={ROUTES.register}>{highlighted ? 'Comenzar' : 'Solicitar información'}</Link>
      </Button>
    </div>
  );
}

export function PlansSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.plans,
    queryFn: () => get<Plan[]>(ENDPOINTS.billing.plans),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const plans = data?.filter((plan) => plan.active) ?? [];

  return (
    <section id="planes" className="scroll-mt-20 bg-muted/40 py-20 lg:py-28">
      <div className="container space-y-14">
        <SectionHeading
          eyebrow="Planes"
          title="Planes adaptados al volumen de tu empresa"
          description="Configuramos tu plan según la cantidad de comprobantes, usuarios y módulos que necesitas. Contáctanos y te preparamos una propuesta."
        />
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[440px] rounded-2xl" />)}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border bg-card px-6 py-8 text-center">
            <p className="text-muted-foreground">No pudimos cargar los planes publicados.</p>
            <Button variant="outline" className="mt-4" onClick={() => void refetch()}>Volver a intentar</Button>
          </div>
        ) : plans.length === 0 ? (
          <p className="rounded-2xl border bg-card px-6 py-8 text-center text-muted-foreground">Aún no hay planes publicados.</p>
        ) : (
          <div className={cn(
            'grid gap-6 lg:items-stretch',
            plans.length === 1 ? 'mx-auto max-w-md' : plans.length === 2 ? 'mx-auto max-w-4xl md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3',
          )}>
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="h-full">
                <PlanCard plan={p} />
              </Reveal>
            ))}
          </div>
        )}
        {plans.length > 0 && <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 text-center text-sm sm:flex-row sm:text-left">
            <MessageSquare className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <p className="flex-1 text-muted-foreground">
              Estos son los planes publicados. Si necesitas una propuesta para tu empresa, regístrate y nuestro equipo comercial te contactará.
            </p>
          </div>
        </Reveal>}
      </div>
    </section>
  );
}
