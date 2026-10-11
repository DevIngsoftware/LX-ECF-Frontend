import { BarChart3, Bell, FileSearch, FileText, Printer, Search, Settings2, UserCog, Users } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { ECF_TYPES } from '@/constants/ecf';
import { SectionHeading } from './SectionHeading';

const FEATURES = [
  { icon: FileSearch, title: 'Consulta de estados', text: 'Seguimiento del trackId y del estado de cada comprobante: en proceso, aceptado, aceptado condicional o rechazado.' },
  { icon: Users, title: 'Clientes y proveedores', text: 'Directorio con RNC o cédula, historial de comprobantes y datos listos para reutilizar.' },
  { icon: BarChart3, title: 'Reportes', text: 'Ventas, ITBIS, comprobantes por tipo y estado, con exportación para tu contabilidad.' },
  { icon: Bell, title: 'Notificaciones', text: 'Alertas de rechazos, vencimiento de certificado y secuencias próximas a agotarse.' },
  { icon: UserCog, title: 'Usuarios y roles', text: 'Perfiles de administración, facturación, contabilidad y consulta con permisos diferenciados.' },
  { icon: Printer, title: 'Representación impresa', text: 'Descarga del comprobante en PDF y del XML firmado para enviarlo a tus clientes.' },
  { icon: Search, title: 'Búsqueda avanzada', text: 'Filtra por fechas, tipo, cliente, estado o e-NCF y encuentra cualquier comprobante al instante.' },
  { icon: Settings2, title: 'Configuración guiada', text: 'Asistente paso a paso para datos fiscales, certificado digital y secuencias autorizadas.' },
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="scroll-mt-20 bg-muted/40 py-20 lg:py-28">
      <div className="container space-y-14">
        <SectionHeading
          eyebrow="Funcionalidades"
          title="Una plataforma completa de facturación electrónica"
          description="Desde la emisión hasta el análisis: cada etapa del ciclo de tus comprobantes, en un solo lugar."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Reveal className="md:col-span-2 lg:row-span-2">
            <div className="relative h-full overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-elevated sm:p-8">
              <div className="bg-grid absolute inset-0 opacity-30 [--foreground:0_0%_100%]" aria-hidden />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" aria-hidden />
              <div className="relative flex h-full flex-col">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
                  <FileText className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-6 text-2xl font-extrabold">Emisión de e-CF del E31 al E47</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                  Formularios que se adaptan al tipo de comprobante: comprador, referencias, retenciones y condiciones de pago según corresponda. Validaciones antes del envío.
                </p>
                <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ECF_TYPES.map((t) => (
                    <li key={t.code} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors hover:border-brand/50 hover:bg-white/[0.07]">
                      <p className="font-mono text-xs font-bold text-brand">{t.code}</p>
                      <p className="truncate text-xs text-zinc-300">{t.short}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.05}>
              <div className="surface surface-hover group h-full p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-foreground transition-colors group-hover:border-brand/40 group-hover:text-brand">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
