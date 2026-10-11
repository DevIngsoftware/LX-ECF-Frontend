import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function FinalCta() {
  return (
    <section className="pb-20 lg:pb-28">
      <div className="container">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-white shadow-elevated sm:px-12 lg:py-20">
            <div className="bg-grid absolute inset-0 opacity-30 [--foreground:0_0%_100%] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
            <div className="absolute -bottom-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-2xl space-y-6">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Lleva tu facturación al <span className="text-brand">siguiente nivel</span>.
              </h2>
              <p className="text-base text-zinc-400 sm:text-lg">
                Crea tu cuenta, configura tu empresa con nuestro asistente y prepárate para emitir comprobantes electrónicos.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="group">
                  <Link to={ROUTES.register}>
                    Comenzar ahora <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link to={ROUTES.login}>Iniciar sesión</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
