import { Reveal } from '@/components/animations/motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SectionHeading } from './SectionHeading';

const FAQ = [
  {
    q: '¿Qué es un comprobante fiscal electrónico (e-CF)?',
    a: 'Es la versión digital de un comprobante fiscal: un documento XML firmado electrónicamente que se transmite a la DGII y tiene la misma validez que el comprobante en papel. Se identifica con un e-NCF que inicia con la letra E seguida del tipo, por ejemplo E31.',
  },
  {
    q: '¿Qué tipos de e-CF puedo emitir con LX e-CF?',
    a: 'La plataforma contempla los tipos E31 (crédito fiscal), E32 (consumo), E33 y E34 (notas de débito y crédito), E41 (compras), E43 (gastos menores), E44 (regímenes especiales), E45 (gubernamental), E46 (exportaciones) y E47 (pagos al exterior).',
  },
  {
    q: '¿Qué necesito para comenzar a emitir?',
    a: 'Tu empresa debe estar habilitada como emisor electrónico ante la DGII, contar con un certificado digital para firma y tener secuencias e-NCF autorizadas. LX e-CF te guía en la configuración y verifica estos requisitos antes de habilitar la emisión real.',
  },
  {
    q: '¿Cómo se maneja mi certificado digital?',
    a: 'El certificado (.p12 o .pfx) se carga una sola vez y se resguarda en el servidor. La contraseña se transmite de forma segura únicamente al backend para su validación y nunca se guarda en tu navegador.',
  },
  {
    q: '¿LX e-CF se conecta directamente con la DGII?',
    a: 'La plataforma trabaja con los servicios oficiales de la DGII a través del backend de LX: envía los comprobantes firmados, recibe el trackId y consulta su estado. Tu navegador nunca se comunica directamente con la DGII.',
  },
  {
    q: '¿Mis datos están separados de los de otras empresas?',
    a: 'Sí. Cada empresa opera en un espacio aislado, con usuarios y permisos propios. Los roles determinan qué puede ver o hacer cada persona de tu equipo.',
  },
  {
    q: '¿Puedo integrar LX e-CF con mi sistema actual?',
    a: 'Sí. El módulo de API permite emitir y consultar comprobantes desde tu ERP, punto de venta o sistema propio. La documentación está disponible en el portal de desarrolladores.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Los planes se configuran según el volumen de comprobantes, la cantidad de usuarios y los módulos que necesites. Regístrate y te prepararemos una propuesta adaptada a tu empresa.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          align="left"
          eyebrow="Preguntas frecuentes"
          title="Resolvemos tus dudas"
          description="Lo esencial sobre facturación electrónica, la DGII y cómo funciona LX e-CF."
          className="lg:sticky lg:top-24 lg:self-start"
        />
        <Reveal delay={0.08}>
          <Accordion type="single" collapsible className="surface divide-y px-2 sm:px-4">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-b-0">
                <AccordionTrigger className="px-2 text-left text-[15px] font-semibold hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="px-2 text-sm leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
