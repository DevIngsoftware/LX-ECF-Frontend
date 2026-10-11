import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRightLeft, Check, Loader2, Minus, Sparkles } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/components/animations/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { billingService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Plan } from '@/types/account';
import { formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { ALL_MODULES, MODULE_LABELS } from './subscription-utils';

const limit = (v: number | null, unit: string) => (v === null ? `${unit} ilimitados` : `Hasta ${formatNumber(v)} ${unit}`);

export function PlanComparison({ plans, currentPlanId }: { plans: Plan[]; currentPlanId?: string }) {
  const qc = useQueryClient();
  const [target, setTarget] = useState<Plan | null>(null);
  const visible = plans.filter((p) => p.active);

  const change = useMutation({
    mutationFn: (p: Plan) => billingService.requestPlanChange(p.id),
    onSuccess: (_, p) => {
      toast.success(`Solicitud de cambio al plan ${p.name} enviada`, { description: 'Un asesor de LX confirmará el cambio y las condiciones aplicables.' });
      setTarget(null);
      void qc.invalidateQueries({ queryKey: queryKeys.subscription });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
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
              <p className="mt-4 text-2xl font-bold">{p.priceLabel ?? 'Consultar'}</p>
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
                {current ? 'Plan actual' : <><ArrowRightLeft /> Cambiar plan</>}
              </Button>
            </motion.article>
          );
        })}
      </motion.div>

      <Dialog open={!!target} onOpenChange={(o) => !o && !change.isPending && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar cambio de plan</DialogTitle>
            <DialogDescription>
              El cambio no se aplica de inmediato. Un asesor de LX revisará la solicitud y te confirmará condiciones y fecha efectiva.
            </DialogDescription>
          </DialogHeader>
          {target && (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Nuevo plan</span><strong>{target.name}</strong></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Precio</span><strong>{target.priceLabel ?? 'Consultar'}</strong></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Usuarios</span><span>{target.userLimit === null ? 'Ilimitados' : formatNumber(target.userLimit)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Módulos</span><span>{target.modules.length}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={change.isPending}>Cancelar</Button>
            <Button onClick={() => target && change.mutate(target)} disabled={change.isPending}>
              {change.isPending && <Loader2 className="animate-spin" />} Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
