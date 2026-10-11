import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, MessageSquare } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { billingService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import type { ModuleKey, Plan } from '@/types/account';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

const MODULE_LABELS: Record<ModuleKey, string> = {
  reception: 'Recepción de e-CF',
  receivables: 'Cuentas por cobrar',
  catalog: 'Catálogo de productos',
  advanced_reports: 'Reportes avanzados',
  api: 'API comercial',
  expenses: 'Gestión de gastos',
};

/** Contenido de respaldo si el catálogo de planes no está disponible públicamente. */
const FALLBACK_PLANS: Plan[] = [
  { id: 'fb-1', name: 'Inicial', description: 'Para empresas que comienzan con la facturación electrónica.', priceLabel: null, invoiceLimit: null, userLimit: null, modules: ['catalog'], active: true },
  { id: 'fb-2', name: 'Empresarial', description: 'Para empresas en crecimiento con varios usuarios y módulos.', priceLabel: null, invoiceLimit: null, userLimit: null, modules: ['catalog', 'receivables', 'api'], active: true, highlighted: true },
  { id: 'fb-3', name: 'Corporativo', description: 'Para operaciones de alto volumen e integraciones avanzadas.', priceLabel: null, invoiceLimit: null, userLimit: null, modules: ['catalog', 'receivables', 'api', 'reception', 'advanced_reports', 'expenses'], active: true },
];

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
      <p className="mt-6 font-display text-3xl font-extrabold">{plan.priceLabel ?? 'Consultar'}</p>
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
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.plans, queryFn: billingService.plans, retry: false, staleTime: 5 * 60_000 });
  const plans = (isError || !data?.length ? FALLBACK_PLANS : data.filter((p) => p.active)).slice(0, 3);

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
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08} className="h-full">
                <PlanCard plan={p} />
              </Reveal>
            ))}
          </div>
        )}
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 text-center text-sm sm:flex-row sm:text-left">
            <MessageSquare className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <p className="flex-1 text-muted-foreground">
              Los precios no se publican porque cada plan se ajusta a tu operación. Regístrate y nuestro equipo comercial te contactará.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
