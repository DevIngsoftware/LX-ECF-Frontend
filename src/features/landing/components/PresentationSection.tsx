import { Building2, Cpu, MapPin } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { COMPANY } from '@/constants/env';

const PILLARS = [
  { icon: MapPin, title: 'Hecho en República Dominicana', text: 'Diseñado para la normativa local de comprobantes fiscales electrónicos y la forma de trabajar de las empresas dominicanas.' },
  { icon: Building2, title: 'Arquitectura multiempresa', text: 'Cada empresa opera en su propio espacio, con usuarios, roles y datos completamente separados.' },
  { icon: Cpu, title: 'Tecnología de LoadExpress', text: 'Respaldado por el equipo tecnológico de LoadExpress, con foco en estabilidad, seguridad y soporte cercano.' },
];

export function PresentationSection() {
  return (
    <section id="presentation" className="scroll-mt-20 border-y bg-card/50">
      <div className="container grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-24">
        <Reveal className="space-y-5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <span className="h-px w-6 bg-brand" aria-hidden />
            {COMPANY.legalName} presenta
          </p>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            LX <span className="text-brand">e-CF</span>, la nueva forma de facturar en tu empresa.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            LX e-CF reúne en un solo lugar la emisión de comprobantes fiscales electrónicos, el seguimiento de su estado y la información que tu equipo necesita para decidir. Sin instalaciones, desde cualquier dispositivo.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pensado tanto para empresas que inician su transición a la facturación electrónica como para organizaciones que necesitan integrar sus sistemas existentes.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="surface surface-hover h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                  <p.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
