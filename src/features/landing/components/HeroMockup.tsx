import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, FileSignature, Hash, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const KPIS = [
  { label: 'Comprobantes', value: '1,248', delta: '+12%' },
  { label: 'Facturado', value: 'RD$ 4.8M', delta: '+8%' },
  { label: 'Clientes activos', value: '326', delta: '+5%' },
];

const BARS = [38, 52, 44, 68, 57, 74, 63, 82, 70, 88, 76, 94];

const ROWS: { ncf: string; party: string; amount: string; status: string; tone: 'success' | 'info' | 'warning' }[] = [
  { ncf: 'E310000000412', party: 'Distribuidora Ejemplo', amount: 'RD$ 58,420.00', status: 'Aceptado', tone: 'success' },
  { ncf: 'E320000001287', party: 'Consumidor final', amount: 'RD$ 3,150.00', status: 'En proceso', tone: 'info' },
  { ncf: 'E310000000411', party: 'Servicios Demo, S.R.L.', amount: 'RD$ 21,900.00', status: 'Aceptado condicional', tone: 'warning' },
];

const chip: Record<'success' | 'info' | 'warning', string> = {
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
};

const dot: Record<'success' | 'info' | 'warning', string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
};

/** Maqueta ilustrativa del producto construida con elementos HTML. Los datos son de demostración. */
export function HeroMockup() {
  const reduce = useReducedMotion();
  const float = (dy: number, duration: number) =>
    reduce ? undefined : { y: [0, dy, 0], transition: { duration, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Vista ilustrativa del panel de LX e-CF" role="img">
      <div className="absolute -inset-6 rounded-[2rem] bg-brand/10 blur-2xl dark:bg-brand/20" aria-hidden />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl border bg-card shadow-elevated"
        style={{ transformPerspective: 1200 }}
      >
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-brand/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Panel de facturación</span>
          <span className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Demo</span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {KPIS.map((k, i) => (
              <motion.div
                key={k.label}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.1, duration: 0.4 }}
                className="rounded-xl border bg-background/60 p-2.5 sm:p-3"
              >
                <p className="truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">{k.label}</p>
                <p className="mt-1 truncate font-display text-sm font-extrabold sm:text-lg">{k.value}</p>
                <p className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                  <TrendingUp className="h-3 w-3" aria-hidden /> {k.delta}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-xl border bg-background/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold">Emisión mensual</p>
              <span className="text-[10px] text-muted-foreground">Datos de demostración</span>
            </div>
            <div className="flex h-24 items-end gap-1.5" aria-hidden>
              {BARS.map((h, i) => (
                <motion.span
                  key={i}
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.6 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('flex-1 rounded-t-[4px]', i === BARS.length - 1 ? 'bg-brand' : 'bg-foreground/15')}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            {ROWS.map((r, i) => (
              <motion.div
                key={r.ncf}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] font-semibold">{r.ncf}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{r.party}</p>
                </div>
                <p className="hidden text-[11px] font-medium tabular-nums sm:block">{r.amount}</p>
                <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold', chip[r.tone])}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', dot[r.tone])} aria-hidden />
                  {r.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="absolute -right-2 -top-5 sm:-right-6"
      >
        <motion.div animate={float(-6, 4)} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-elevated">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-info-soft text-info"><Hash className="h-4 w-4" aria-hidden /></span>
          <div>
            <p className="text-[10px] text-muted-foreground">trackId recibido</p>
            <p className="font-mono text-[11px] font-semibold">a9f3-…-7c21</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.35, duration: 0.4 }}
        className="absolute -bottom-6 -left-2 sm:-left-8"
      >
        <motion.div animate={float(6, 5)} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-elevated">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileSignature className="h-4 w-4" aria-hidden /></span>
          <div>
            <p className="text-[11px] font-semibold">XML firmado</p>
            <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-success" aria-hidden /> Certificado digital
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
