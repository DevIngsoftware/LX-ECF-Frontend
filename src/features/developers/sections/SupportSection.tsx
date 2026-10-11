import { Globe, Mail, MessageCircle, Phone, type LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { COMPANY } from '@/constants/env';
import { Callout, DocBlock, DocHeader } from '../components/doc-ui';

const FAQ = [
  {
    q: '¿La API está disponible en todos los planes?',
    a: 'El acceso a la API depende del módulo contratado. Revisa tu suscripción o contacta al equipo comercial para conocer la disponibilidad.',
  },
  {
    q: '¿Qué hago si una emisión devuelve un error de tiempo de espera?',
    a: 'No emitas un comprobante nuevo. Repite la solicitud con la misma Idempotency-Key o consulta el listado para verificar si el comprobante fue creado.',
  },
  {
    q: '¿Cuánto tarda la DGII en responder?',
    a: 'Normalmente unos segundos, pero puede tardar más en horas de alta demanda. Mientras tanto, el estado DGII figura como en proceso.',
  },
  {
    q: '¿Puedo recuperar el secreto de una credencial?',
    a: 'No. El secreto se muestra una sola vez. Si lo pierdes, revoca la credencial y crea una nueva.',
  },
  {
    q: '¿Dónde está la especificación OpenAPI?',
    a: 'Se publicará en este portal. Hasta entonces, los contratos mostrados son ilustrativos.',
  },
];

const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '')}`;

export function SupportSection() {
  const channels: { icon: LucideIcon; label: string; value: string; href: string }[] = [];
  if (COMPANY.email) channels.push({ icon: Mail, label: 'Correo', value: COMPANY.email, href: `mailto:${COMPANY.email}` });
  if (COMPANY.phone) channels.push({ icon: Phone, label: 'Teléfono', value: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, '')}` });
  if (COMPANY.whatsapp) channels.push({ icon: MessageCircle, label: 'WhatsApp', value: COMPANY.whatsapp, href: waLink(COMPANY.whatsapp) });
  if (COMPANY.website) channels.push({ icon: Globe, label: 'Sitio web', value: COMPANY.website.replace(/^https?:\/\//, ''), href: COMPANY.website });

  return (
    <>
      <DocHeader eyebrow="Mi cuenta" title="Soporte" description={`El equipo técnico de ${COMPANY.legalName} te acompaña en tu integración.`} />

      <DocBlock title="Canales de contacto">
        {channels.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="surface surface-hover flex items-center gap-4 p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <c.icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="truncate font-medium">{c.value}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <Callout tone="info">Los canales oficiales de soporte se publicarán próximamente.</Callout>
        )}
        <p className="text-sm text-muted-foreground">Al reportar un problema incluye el traceId de la respuesta, la fecha y hora y la ruta del endpoint. Nunca compartas tu secreto.</p>
      </DocBlock>

      <DocBlock title="Preguntas frecuentes">
        <Accordion type="single" collapsible className="surface divide-y overflow-hidden">
          {FAQ.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="border-b-0 px-5">
              <AccordionTrigger className="text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DocBlock>
    </>
  );
}
