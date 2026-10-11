import { Activity, Clock3, Gauge, ShieldCheck, Smartphone, Workflow } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { SectionHeading } from './SectionHeading';

const BENEFITS = [
  { icon: Clock3, title: 'Menos tiempo administrativo', text: 'Emite comprobantes en pocos pasos, con datos de clientes y productos reutilizables y validaciones antes de enviar.' },
  { icon: Activity, title: 'Visibilidad en tiempo real', text: 'Conoce el estado de cada comprobante ante la DGII y recibe alertas cuando algo requiere tu atención.' },
  { icon: ShieldCheck, title: 'Seguridad por diseño', text: 'Acceso por roles, sesiones protegidas y el certificado digital resguardado en el servidor, nunca en el navegador.' },
  { icon: Workflow, title: 'Integración sin fricción', text: 'Conecta tu ERP, punto de venta o sistema propio mediante una API documentada.' },
  { icon: Gauge, title: 'Escala con tu negocio', text: 'Activa módulos adicionales cuando los necesites, sin migraciones ni cambios de plataforma.' },
  { icon: Smartphone, title: 'Desde cualquier lugar', text: 'Interfaz adaptada a escritorio, tableta y móvil, en modo claro u oscuro.' },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container space-y-14">
        <SectionHeading
          eyebrow="Beneficios"
          title="Todo lo que tu equipo necesita para facturar con tranquilidad"
          description="Una plataforma pensada para reducir errores, ahorrar tiempo y darte control sobre tus comprobantes."
        />
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 3) * 0.06} className="h-full">
              <div className="group relative h-full bg-card p-7 transition-colors hover:bg-accent/40">
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <b.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
