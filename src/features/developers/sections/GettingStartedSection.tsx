import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { ROUTES } from '@/constants/routes';
import { Callout, DocBlock, DocHeader, InlineCode } from '../components/doc-ui';

const STEPS = [
  {
    title: 'Crea tu cuenta de empresa',
    text: 'Registra tu empresa y completa la configuración inicial: datos fiscales, certificado digital y secuencias autorizadas.',
    link: { to: ROUTES.register, label: 'Crear cuenta' },
  },
  {
    title: 'Genera una credencial de pruebas',
    text: 'Desde la sección Credenciales crea una clave para el ambiente de pruebas. El secreto se muestra una sola vez.',
    link: { to: ROUTES.developers.section('credenciales'), label: 'Ir a credenciales' },
  },
  {
    title: 'Autentica tus solicitudes',
    text: 'Envía el token en el encabezado Authorization en cada solicitud. Nunca expongas el secreto en el navegador.',
    link: { to: ROUTES.developers.section('autenticacion'), label: 'Ver autenticación' },
  },
  {
    title: 'Emite tu primer comprobante',
    text: 'Envía una solicitud de emisión con un encabezado Idempotency-Key único para evitar duplicados.',
    link: { to: ROUTES.developers.section('ejemplos'), label: 'Ver ejemplos' },
  },
  {
    title: 'Consulta el estado DGII',
    text: 'La DGII puede tardar en responder. Consulta el estado periódicamente hasta obtener un resultado definitivo.',
    link: { to: ROUTES.developers.section('respuestas'), label: 'Ver respuestas' },
  },
];

const FIRST_CALL = `curl -X GET "https://{BASE_URL_PRUEBAS}/v1/api-client/facturas?size=5" \\
  -H "Authorization: Bearer $LX_ACCESS_TOKEN" \\
  -H "Accept: application/json"`;

export function GettingStartedSection() {
  const reduce = useReducedMotion();
  return (
    <>
      <DocHeader eyebrow="Comenzar" title="Primeros pasos" description="Sigue estos pasos para realizar tu primera integración en el ambiente de pruebas." />

      <DocBlock>
        <ol className="relative space-y-4">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="surface flex gap-4 p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-primary-foreground tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
                <Link to={s.link.to} className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-brand hover:underline">
                  {s.link.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </motion.li>
          ))}
        </ol>
      </DocBlock>

      <DocBlock title="Tu primera llamada" description="Lista los comprobantes más recientes para verificar que tu credencial funciona.">
        <CodeBlock lang="bash" title="cURL — Lista de comprobantes" code={FIRST_CALL} />
        <p className="text-sm text-muted-foreground">
          Reemplaza <InlineCode>{'{BASE_URL_PRUEBAS}'}</InlineCode> por la URL de tu instalación en pruebas y define la variable{' '}
          <InlineCode>LX_ACCESS_TOKEN</InlineCode> con el token obtenido al intercambiar tu API Key y API Secret en tu servidor.
        </p>
        <Callout tone="info">Usa siempre el ambiente de pruebas hasta validar tu integración de extremo a extremo.</Callout>
      </DocBlock>
    </>
  );
}
