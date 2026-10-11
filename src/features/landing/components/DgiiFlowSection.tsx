import { FileCode2, FileSignature, Info, Radar, Send, Server } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  { icon: FileCode2, title: 'Generación del comprobante', text: 'Completas el comprobante en LX e-CF o lo envías desde tu sistema por API. La plataforma valida los datos y construye el XML.' },
  { icon: FileSignature, title: 'Firma con tu certificado digital', text: 'El XML se firma en el servidor con el certificado digital de tu empresa. El certificado y su contraseña nunca se exponen en el navegador.' },
  { icon: Send, title: 'Envío a la DGII', text: 'El comprobante firmado se transmite a los servicios oficiales de la DGII, que responden con un identificador de seguimiento (trackId).' },
  { icon: Radar, title: 'Consulta de estado', text: 'LX e-CF consulta el resultado con el trackId y te muestra el estado de cada comprobante, con el detalle de cualquier observación.' },
];

export function DgiiFlowSection() {
  return (
    <section id="dgii" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="Flujo con la DGII"
            title="Del comprobante al estado final, con total trazabilidad"
            description="Así recorre cada e-CF el camino desde tu empresa hasta la Dirección General de Impuestos Internos."
          />
          <Reveal delay={0.1}>
            <div className="surface space-y-4 p-6">
              <p className="text-sm font-semibold">Estados que verás en la plataforma</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="En proceso" tone="info" />
                <StatusBadge label="Aceptado" tone="success" />
                <StatusBadge label="Aceptado condicional" tone="warning" />
                <StatusBadge label="Rechazado" tone="danger" />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                El estado lo determina la DGII. LX e-CF lo refleja tal como lo recibe y te ayuda a actuar cuando hay observaciones o rechazos.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="space-y-6">
          <ol className="relative space-y-4">
            <span className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-brand via-border to-transparent" aria-hidden />
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <li className="relative flex gap-5">
                  <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-card">
                    <s.icon className="h-6 w-6 text-brand" aria-hidden />
                  </span>
                  <div className="surface flex-1 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paso {i + 1}</p>
                    <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.2}>
            <div className="flex gap-4 rounded-2xl border border-info/30 bg-info-soft p-5">
              <Server className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold">Conexión a través del backend de LX</p>
                <p className="leading-relaxed text-muted-foreground">
                  La plataforma trabaja con los servicios oficiales de la DGII a través del backend de LX e-CF. Tu navegador nunca se comunica directamente con la DGII.
                </p>
                <p className="flex gap-1.5 leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  La emisión real requiere que tu empresa esté habilitada como emisor electrónico ante la DGII y cuente con certificado digital y secuencias autorizadas.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
