import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Blocks, CreditCard, Info } from 'lucide-react';
import { PageTransition, staggerContainer } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { billingService, modulesService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ModuleInfo } from '@/types/account';
import { ModuleCard } from '../components/ModuleCard';
import { MODULE_FILTERS, viewStatus, type ModuleFilter } from '../components/module-meta';

interface PendingAction {
  module: ModuleInfo;
  kind: 'activate' | 'request';
}

export function ModulesPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('billing.manage');
  const [filter, setFilter] = useState<ModuleFilter>('all');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const modules = useQuery({ queryKey: queryKeys.modules, queryFn: modulesService.list });
  const subscription = useQuery({ queryKey: queryKeys.subscription, queryFn: billingService.subscription, enabled: canManage });

  const items = useMemo(
    () => (modules.data ?? []).map((m) => ({ module: m, status: viewStatus(m, subscription.data?.modules) })),
    [modules.data, subscription.data],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [items]);
  const visible = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const request = useMutation({
    mutationFn: (m: ModuleInfo) => modulesService.request(m.key),
    onSuccess: (_, m) => {
      toast.success(pending?.kind === 'activate' ? `Solicitud de activación enviada: ${m.name}` : `Solicitud enviada: ${m.name}`, {
        description: 'El equipo de LX revisará la solicitud y te notificará cuando el módulo esté disponible.',
      });
      setPending(null);
      void qc.invalidateQueries({ queryKey: queryKeys.modules });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Cuenta"
        title="Módulos"
        description="Amplía LX e-CF con funcionalidades adicionales según las necesidades de tu empresa."
        actions={canManage && (
          <Button asChild variant="outline">
            <Link to={ROUTES.app.subscription}><CreditCard /> Ver mi plan</Link>
          </Button>
        )}
      />

      {!canManage && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Solo un administrador de la cuenta puede activar o solicitar módulos.</p>
        </div>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ModuleFilter)} className="mb-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max">
            {MODULE_FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="gap-1.5">
                {f.label}
                {modules.data && <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{counts[f.value] ?? 0}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {modules.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : modules.error ? (
        <div className="surface"><ErrorState error={modules.error} onRetry={() => void modules.refetch()} /></div>
      ) : visible.length === 0 ? (
        <div className="surface">
          <EmptyState icon={Blocks} title="Sin módulos en esta categoría" description="Prueba con otro filtro para ver más módulos." />
        </div>
      ) : (
        <motion.div key={filter} variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ module, status }) => (
            <ModuleCard key={module.key} module={module} status={status} canManage={canManage} onAction={(m, kind) => setPending({ module: m, kind })} />
          ))}
        </motion.div>
      )}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && !request.isPending && setPending(null)}
        title={pending?.kind === 'activate' ? `Activar ${pending.module.name}` : `Solicitar ${pending?.module.name ?? ''}`}
        description={
          pending?.kind === 'activate'
            ? 'Este módulo está incluido en tu plan. Enviaremos la solicitud de activación y te notificaremos cuando esté listo.'
            : 'Este módulo no está incluido en tu plan actual. Un asesor de LX te contactará para revisar las opciones disponibles.'
        }
        confirmLabel={pending?.kind === 'activate' ? 'Activar módulo' : 'Enviar solicitud'}
        loading={request.isPending}
        onConfirm={() => pending && request.mutate(pending.module)}
      >
        {pending && pending.module.requirements.length > 0 && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Requisitos</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
              {pending.module.requirements.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}
      </ConfirmDialog>
    </PageTransition>
  );
}
