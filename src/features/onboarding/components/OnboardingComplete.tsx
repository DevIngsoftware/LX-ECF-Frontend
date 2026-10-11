import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Clock, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function OnboardingComplete({ canIssue, pending }: { canIssue: boolean; pending: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="surface mx-auto max-w-2xl overflow-hidden text-center"
    >
      <div className="relative bg-ink px-6 py-10 text-white">
        <div className="bg-grid absolute inset-0 opacity-25 [--foreground:0_0%_100%]" aria-hidden />
        <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <motion.span
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40"
        >
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </motion.span>
        <h2 className="relative mt-5 text-2xl font-extrabold text-white">Configuración enviada</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-zinc-400">Recibimos la información de tu empresa.</p>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-left text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            {canIssue
              ? 'El sistema confirmó los requisitos de tu empresa.'
              : 'LX verificará la configuración; la emisión real se habilita cuando el sistema confirme los requisitos.'}
            {pending > 0 && ` Tienes ${pending} ${pending === 1 ? 'paso pendiente' : 'pasos pendientes'} que puedes completar desde Configuración.`}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg"><Link to={ROUTES.app.root}><LayoutDashboard /> Ir al panel</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to={ROUTES.app.settings}><Settings /> Ver configuración</Link></Button>
        </div>
      </div>
    </motion.div>
  );
}
