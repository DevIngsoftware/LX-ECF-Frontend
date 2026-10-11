import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Check, Minus, Sparkles } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/components/animations/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Plan } from '@/types/account';
import { formatNumber, formatPlanPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import { ALL_MODULES, MODULE_LABELS } from './subscription-utils';
import { DepositRequestDialog } from './DepositRequestDialog';

const limit = (v: number | null, unit: string) => (v === null ? `${unit} ilimitados` : `Hasta ${formatNumber(v)} ${unit}`);

export function PlanComparison({ plans, currentPlanId }: { plans: Plan[]; currentPlanId?: string }) {
  const [target, setTarget] = useState<Plan | null>(null);
  const visible = plans.filter((p) => p.active);

  return (
    <>
      {visible.length === 0 && <p className="surface p-5 text-sm text-muted-foreground">Aún no hay planes activos disponibles. Consulta con el equipo de LX e-CF.</p>}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => {
          const current = p.id === currentPlanId;
          return (
            <motion.article
              key={p.id}
              variants={staggerItem}
              className={cn('surface relative flex flex-col p-5', p.highlighted && !current && 'ring-1 ring-brand/40', current && 'ring-2 ring-brand')}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {current ? <Badge variant="brand">Plan actual</Badge> : p.highlighted ? <Badge variant="neutral"><Sparkles className="h-3 w-3" /> Recomendado</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-2xl font-bold">{formatPlanPrice(p.priceLabel)}</p>
              {!p.priceLabel && <p className="text-xs text-muted-foreground">Precio según volumen y necesidades</p>}

              <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {limit(p.invoiceLimit, 'comprobantes')}</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {limit(p.userLimit, 'usuarios')}</li>
                {ALL_MODULES.map((m) => {
                  const inc = p.modules.includes(m);
                  return (
                    <li key={m} className={cn('flex items-center gap-2', !inc && 'text-muted-foreground/70')}>
                      {inc ? <Check className="h-4 w-4 text-success" /> : <Minus className="h-4 w-4" />}
                      <span className={cn(!inc && 'line-through decoration-muted-foreground/40')}>{MODULE_LABELS[m]}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="min-h-4 flex-1" />
              <Button className="w-full" variant={current ? 'outline' : p.highlighted ? 'default' : 'secondary'} disabled={current} onClick={() => setTarget(p)}>
                {current ? 'Plan actual' : <><ArrowRightLeft /> {currentPlanId ? 'Cambiar plan' : 'Elegir plan'}</>}
              </Button>
            </motion.article>
          );
        })}
      </motion.div>

      {target && <DepositRequestDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}
        kind="PLAN" targetId={target.id} targetName={target.name} />}
    </>
  );
}
