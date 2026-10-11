import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Code2, Layers, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { HeroMockup } from './HeroMockup';

const TRUST = [
  { icon: Layers, text: 'Tipos E31 a E47' },
  { icon: Lock, text: 'Datos aislados por empresa' },
  { icon: Code2, text: 'API para integraciones' },
];

export function HeroSection() {
  const reduce = useReducedMotion();
  const item = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl dark:bg-brand/20" aria-hidden />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-brand/10 blur-3xl" aria-hidden />

      <div className="container relative grid items-center gap-16 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-12 lg:pb-28 lg:pt-24">
        <div className="space-y-8 text-center lg:text-left">
          <motion.a
            {...item(0)}
            href="#presentation"
            className="inline-flex items-center gap-2 rounded-full border bg-card/80 py-1 pl-1 pr-3 text-xs font-medium shadow-card backdrop-blur transition-colors hover:border-brand/40"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
              <Sparkles className="h-3 w-3" aria-hidden /> Nuevo
            </span>
            LoadExpress presenta LX e-CF
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </motion.a>

          <motion.h1 {...item(0.08)} className="text-4xl font-extrabold leading-[1.08] sm:text-5xl xl:text-6xl">
            Facturación electrónica <span className="text-gradient-brand">inteligente</span> para empresas que quieren crecer.
          </motion.h1>

          <motion.p {...item(0.16)} className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            Emite, gestiona y consulta tus comprobantes fiscales electrónicos desde una plataforma moderna, segura y preparada para integrarse con tus sistemas.
          </motion.p>

          <motion.div {...item(0.24)} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="group">
              <Link to={ROUTES.register}>
                Comenzar <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#funcionalidades">Explorar funcionalidades</a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to={ROUTES.developers.root}>
                <Code2 /> Conocer la API
              </Link>
            </Button>
          </motion.div>

          <motion.ul {...item(0.32)} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand" aria-hidden /> {text}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative px-2 sm:px-6 lg:px-0">
          <HeroMockup />
          <p className="mt-10 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Interfaz ilustrativa con datos de demostración
          </p>
        </div>
      </div>
    </section>
  );
}
