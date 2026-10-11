import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileCode2, KeyRound, Rocket, ShieldCheck, Webhook, Workflow } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/components/animations/motion';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/constants/env';
import { ROUTES } from '@/constants/routes';
import { Callout, DocBlock, DocHeader } from '../components/doc-ui';

const FEATURES = [
  { icon: Workflow, title: 'Emisión de e-CF', text: 'Envía los datos de tus comprobantes y la plataforma se encarga de firmarlos y remitirlos a la DGII.' },
  { icon: ShieldCheck, title: 'Estados en tiempo real', text: 'Consulta el estado interno y el estado DGII de cada comprobante emitido.' },
  { icon: FileCode2, title: 'Representación impresa', text: 'Descarga el PDF y el XML firmado de cada comprobante aceptado.' },
  { icon: Webhook, title: 'Integración con tu sistema', text: 'Conecta tu ERP, punto de venta o tienda en línea mediante una API REST.' },
];

export function IntroSection() {
  return (
    <>
      <DocHeader
        eyebrow="Portal de desarrolladores"
        title={`API de ${COMPANY.product}`}
        description={`Integra la facturación electrónica de la República Dominicana en tus sistemas con la API de ${COMPANY.product}, desarrollada por ${COMPANY.legalName}.`}
      />

      <div className="relative mb-8 overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative space-y-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Esta documentación describe cómo autenticarte, emitir comprobantes fiscales electrónicos (e-CF), consultar su estado y manejar
            respuestas y errores de forma segura.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={ROUTES.developers.section('primeros-pasos')}>
                <Rocket /> Primeros pasos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ROUTES.developers.section('autenticacion')}>
                <KeyRound /> Autenticación
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <DocBlock title="Qué puedes hacer">
        <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <motion.li key={f.title} variants={staggerItem} className="surface surface-hover p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <f.icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </motion.li>
          ))}
        </motion.ul>
      </DocBlock>

      <DocBlock title="Antes de comenzar">
        <Callout tone="warning" title="Contratos ilustrativos">
          Los endpoints, cuerpos y ejemplos de este portal son ilustrativos hasta la publicación de la especificación OpenAPI oficial. No los uses
          como contrato definitivo en producción.
        </Callout>
        <Link to={ROUTES.developers.section('documentacion')} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          Ir a la referencia de endpoints <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </DocBlock>
    </>
  );
}
