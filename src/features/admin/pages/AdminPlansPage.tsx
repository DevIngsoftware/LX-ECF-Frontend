import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, FileText, Layers, Pencil, Plus, Users } from 'lucide-react';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import type { Plan } from '@/types/account';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { MODULE_LABELS, priceText } from '../components/admin-meta';
import { PlanFormDialog } from '../components/PlanFormDialog';

const limitText = (v: number | null, unit: string) => (v == null ? `${unit} ilimitados` : `Hasta ${formatNumber(v)} ${unit}`);

export function AdminPlansPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.admin.plans, queryFn: () => adminService.plans() });

  const openForm = (p: Plan | null) => {
    setEditing(p);
    setOpen(true);
  };

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Administración"
        title="Planes"
        description="Catálogo de planes comerciales. Los precios no publicados se muestran como «Consultar»."
        actions={<Button onClick={() => openForm(null)}><Plus /> Nuevo plan</Button>}
      />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div>
      ) : !data?.length ? (
        <div className="surface">
          <EmptyState icon={Layers} title="Aún no hay planes" action={<Button size="sm" onClick={() => openForm(null)}><Plus /> Nuevo plan</Button>} />
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <motion.article
              key={p.id}
              variants={staggerItem}
              className={cn('surface surface-hover relative flex flex-col p-6', p.highlighted && 'border-brand/50 ring-1 ring-brand/30', !p.active && 'opacity-70')}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{p.name}</h2>
                {p.highlighted && <Badge variant="brand">Destacado</Badge>}
                <Badge variant={p.active ? 'success' : 'neutral'}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight">{priceText(p.priceLabel)}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground"><FileText className="h-4 w-4" aria-hidden /> {limitText(p.invoiceLimit, 'comprobantes')}</li>
                <li className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" aria-hidden /> {limitText(p.userLimit, 'usuarios')}</li>
              </ul>
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Módulos</p>
                {p.modules.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {p.modules.map((m) => (
                      <li key={m} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" aria-hidden /> {MODULE_LABELS[m] ?? m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Solo funciones base.</p>
                )}
              </div>
              <div className="mt-auto pt-6">
                <Button variant="outline" className="w-full" onClick={() => openForm(p)}>
                  <Pencil /> Editar plan
                </Button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <PlanFormDialog open={open} onOpenChange={setOpen} plan={editing} />
    </PageTransition>
  );
}
