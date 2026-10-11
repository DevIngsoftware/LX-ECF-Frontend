import { FlaskConical, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ENV } from '@/constants/env';
import { Callout, DocBlock, DocHeader, InlineCode } from '../components/doc-ui';

const ENVIRONMENTS = [
  {
    icon: FlaskConical,
    name: 'Pruebas y certificación',
    credential: 'sandbox',
    text: 'Para integrar y completar la certificación de la empresa ante la DGII. Los comprobantes de estos ambientes no tienen validez fiscal de producción.',
    tone: 'info' as const,
  },
  {
    icon: Rocket,
    name: 'Producción',
    credential: 'production',
    text: 'Para empresas habilitadas en producción ante la DGII. Los comprobantes emitidos son fiscales.',
    tone: 'success' as const,
  },
];

export function EnvironmentsSection() {
  return (
    <>
      <DocHeader eyebrow="Comenzar" title="Ambientes" description="Usa la URL de la API de tu instalación. El ambiente fiscal se configura por empresa y la credencial técnica debe coincidir con él." />

      <DocBlock title="URL base de la API">
        <p className="text-sm text-muted-foreground">
          En esta instalación: <InlineCode>{ENV.apiBaseUrl || '{URL_DE_TU_API}/v1'}</InlineCode>. Configura esta URL en tu servidor como <InlineCode>LX_API_URL</InlineCode>.
          Las rutas de los ejemplos se agregan a esa base.
        </p>
      </DocBlock>

      <DocBlock title="Credenciales por ambiente">
        <div className="grid gap-4 sm:grid-cols-2">
          {ENVIRONMENTS.map((environment) => (
            <div key={environment.name} className="surface surface-hover p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><environment.icon className="h-4 w-4" aria-hidden /></span>
                <Badge variant={environment.tone}>{environment.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{environment.text}</p>
              <p className="mt-3 text-sm">Valor de la credencial: <InlineCode>{environment.credential}</InlineCode></p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock title="Reglas de acceso">
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground marker:text-brand">
          <li>La API Key comienza con <InlineCode>lxk_</InlineCode> y el secreto con <InlineCode>lxs_</InlineCode>, en ambos ambientes.</li>
          <li>La credencial de pruebas no funciona si la empresa está configurada en producción, ni a la inversa.</li>
          <li>Se necesita una suscripción vigente con el módulo API activo para obtener un token técnico.</li>
        </ul>
        <Callout tone="info">La URL de la API puede cambiar entre instalaciones, pero el ambiente DGII lo determina la configuración de tu empresa.</Callout>
      </DocBlock>
    </>
  );
}
