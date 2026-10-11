import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

/** Se muestra sin shell en rutas públicas y dentro del shell en los portales. */
function isInsideShell(pathname: string) {
  const inside = (root: string) => pathname === root || pathname.startsWith(`${root}/`);
  return inside(ROUTES.app.root) || inside(ROUTES.admin.root);
}

export function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const inShell = isInsideShell(pathname);
  const homeTarget = inShell ? (pathname.startsWith(ROUTES.admin.root) ? ROUTES.admin.root : ROUTES.app.root) : ROUTES.home;

  const content = (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto flex max-w-lg flex-col items-center text-center"
    >
      <p className="select-none font-display text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[9rem]" aria-hidden>
        4<span className="text-brand">0</span>4
      </p>
      <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Página no encontrada</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        La página que buscas no existe, cambió de dirección o no está disponible. Verifica el enlace o vuelve al inicio.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild size="lg">
          <Link to={inShell ? homeTarget : '/'}><Home /> Volver al inicio</Link>
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft /> Ir atrás
        </Button>
      </div>
    </motion.div>
  );

  if (inShell) return <div className="py-16 sm:py-24">{content}</div>;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-3xl" aria-hidden />
      <header className="relative flex h-16 items-center justify-between px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className={cn('relative flex flex-1 items-center justify-center px-6 pb-16')}>{content}</main>
    </div>
  );
}
