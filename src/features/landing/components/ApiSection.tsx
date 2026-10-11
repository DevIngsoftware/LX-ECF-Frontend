import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, KeyRound, SearchCheck, Zap } from 'lucide-react';
import { Reveal } from '@/components/animations/motion';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { EMIT_REQUEST, EMIT_RESPONSE } from '@/features/developers/sections/reference-data';
import { SectionHeading } from './SectionHeading';

const REQUEST = `curl -X POST "$LX_API_URL/api-client/facturas" \\
  -H "Authorization: Bearer $LX_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: <UUID_UNICO>" \\
  -d '${EMIT_REQUEST}'`;

const POINTS = [
  { icon: KeyRound, text: 'Autenticación con credenciales por empresa' },
  { icon: Zap, text: 'Emisión y consulta de estados desde tu sistema' },
  { icon: SearchCheck, text: 'Consulta de estado DGII por e-NCF' },
];

export function ApiSection() {
  return (
    <section id="api" className="scroll-mt-20 border-y bg-card/50 py-20 lg:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <SectionHeading
            align="left"
            eyebrow="API para desarrolladores"
            title="Integra la facturación electrónica en tus sistemas"
            description="Conecta tu ERP, punto de venta o plataforma de comercio con LX e-CF y emite comprobantes sin salir de tus procesos."
          />
          <Reveal delay={0.08}>
            <ul className="space-y-3">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4 w-4" aria-hidden /></span>
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.12} className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={ROUTES.developers.root}>
                <BookOpen /> Ver documentación
              </Link>
            </Button>
            <Button asChild variant="outline" className="group">
              <Link to={ROUTES.register}>
                Crear cuenta <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="min-w-0">
          <Tabs defaultValue="request" className="w-full">
            <div className="mb-3 flex items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="request">Solicitud</TabsTrigger>
                <TabsTrigger value="response">Respuesta</TabsTrigger>
              </TabsList>
              <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ejemplo de integración</span>
            </div>
            <TabsContent value="request" className="mt-0">
              <CodeBlock code={REQUEST} lang="bash" title="Crear comprobante · cURL" />
            </TabsContent>
            <TabsContent value="response" className="mt-0">
              <CodeBlock code={EMIT_RESPONSE} lang="json" title="Crear comprobante · Respuesta JSON" />
            </TabsContent>
          </Tabs>
          <p className="mt-3 text-xs text-muted-foreground">Configura LX_API_URL con la base de tu API, incluido /v1. El envío a la DGII se solicita por separado. Consulta la guía y Swagger para todos los campos.</p>
        </Reveal>
      </div>
    </section>
  );
}
