import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileCheck2, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { COMPANY } from '@/constants/env';
import { ROUTES } from '@/constants/routes';

const POINTS = [
  { icon: FileCheck2, text: 'Emite y consulta tus comprobantes electrónicos e-CF' },
  { icon: ShieldCheck, text: 'Seguimiento claro del estado de cada comprobante ante la DGII' },
  { icon: Zap, text: 'Integración mediante API con tus sistemas' },
  { icon: Lock, text: 'Datos aislados por empresa y acceso por roles' },
];

export function AuthLayout() {
  return (
    <>
      <DemoBanner />
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="bg-grid absolute inset-0 opacity-[0.35] [--foreground:0_0%_100%]" aria-hidden />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/30 blur-3xl" aria-hidden />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand/20 blur-3xl" aria-hidden />
          <Link to={ROUTES.home} className="relative flex w-fit items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" aria-label="LX e-CF, ir al inicio">
            <img src={COMPANY.logo} alt="" className="h-9 w-auto" />
            <span className="font-display text-xl font-extrabold">LX <span className="text-brand">e-CF</span></span>
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-md space-y-8">
            <h2 className="text-4xl font-extrabold leading-tight">
              Facturación electrónica <span className="text-brand">inteligente</span> para empresas que quieren crecer.
            </h2>
            <ul className="space-y-4">
              {POINTS.map((p, i) => (
                <motion.li key={p.text} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5">{p.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <p className="relative text-xs text-zinc-500">© {new Date().getFullYear()} {COMPANY.legalName}</p>
        </aside>
        <div className="flex flex-col">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="lg:invisible"><Logo /></div>
            <div className="flex items-center gap-3">
              <Link to={ROUTES.home} className="text-sm font-medium text-muted-foreground hover:text-foreground">Volver al inicio</Link>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 pb-12">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
              <Outlet />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
