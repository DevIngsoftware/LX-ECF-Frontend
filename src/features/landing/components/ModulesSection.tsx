import { BarChart4, Boxes, Code2, HandCoins, Inbox, Receipt } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { SectionHeading } from './SectionHeading';

const MODULES = [
  { icon: Inbox, name: 'Recepción de e-CF', text: 'Recibe y gestiona los comprobantes electrónicos que te emiten tus proveedores, con aprobación comercial.' },
  { icon: HandCoins, name: 'Cuentas por cobrar', text: 'Controla saldos, vencimientos y pagos de tus clientes a partir de los comprobantes emitidos a crédito.' },
  { icon: Boxes, name: 'Catálogo de productos', text: 'Productos y servicios con precios, unidades e ITBIS predefinidos para facturar más rápido.' },
  { icon: BarChart4, name: 'Reportes avanzados', text: 'Análisis detallado por cliente, producto y período, con indicadores para la toma de decisiones.' },
  { icon: Code2, name: 'API comercial', text: 'Credenciales, registro de uso y documentación para integrar la emisión desde tus sistemas.' },
  { icon: Receipt, name: 'Gestión de gastos', text: 'Registra y categoriza gastos de la empresa y vincúlalos a comprobantes de compras y gastos menores.' },
];

export function ModulesSection() {
  return (
    <section id="modulos" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container space-y-14">
        <SectionHeading
          eyebrow="Módulos opcionales"
          title="Amplía la plataforma a tu medida"
          description="Comienza con la facturación electrónica y activa módulos adicionales a medida que tu operación lo requiera."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.name} delay={(i % 3) * 0.06}>
              <div className="surface surface-hover group flex h-full gap-4 p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-brand group-hover:text-white">
                  <m.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{m.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
