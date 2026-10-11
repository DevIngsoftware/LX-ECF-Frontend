import { FlaskConical, Rocket, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Callout, DocBlock, DocHeader, InlineCode } from '../components/doc-ui';

const ENVIRONMENTS = [
  {
    icon: FlaskConical,
    name: 'Pruebas',
    baseUrl: '{BASE_URL_PRUEBAS}',
    keyPrefix: 'lx_test_',
    text: 'Ambiente para desarrollo e integración. Los comprobantes no tienen validez fiscal.',
    tone: 'info' as const,
  },
  {
    icon: ShieldCheck,
    name: 'Certificación',
    baseUrl: '{BASE_URL_CERTIFICACION}',
    keyPrefix: 'lx_test_',
    text: 'Ambiente para completar el proceso de certificación como emisor electrónico ante la DGII.',
    tone: 'warning' as const,
  },
  {
    icon: Rocket,
    name: 'Producción',
    baseUrl: '{BASE_URL_PRODUCCION}',
    keyPrefix: 'lx_live_',
    text: 'Ambiente real. Los comprobantes emitidos tienen validez fiscal y se remiten a la DGII.',
    tone: 'success' as const,
  },
];

export function EnvironmentsSection() {
  return (
    <>
      <DocHeader eyebrow="Comenzar" title="Ambientes" description="Cada ambiente tiene su propia URL base y sus propias credenciales." />

      <DocBlock>
        <div className="grid gap-4 lg:grid-cols-3">
          {ENVIRONMENTS.map((e) => (
            <div key={e.name} className="surface surface-hover flex flex-col p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <e.icon className="h-4 w-4" aria-hidden />
                </span>
                <Badge variant={e.tone}>{e.name}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{e.text}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">URL base</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                    <InlineCode>{e.baseUrl}</InlineCode>
                    <Badge variant="neutral">Por confirmar</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Prefijo de credencial</dt>
                  <dd className="mt-0.5">
                    <InlineCode>{e.keyPrefix}</InlineCode>
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock title="Recomendaciones">
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground marker:text-brand">
          <li>Configura la URL base mediante variables de entorno para cambiar de ambiente sin modificar código.</li>
          <li>Las credenciales de pruebas no funcionan en producción y viceversa.</li>
          <li>Valida en pruebas todos los tipos de e-CF que vas a emitir antes de pasar a producción.</li>
        </ul>
        <Callout tone="warning" title="URLs por confirmar">
          Las URLs base definitivas se publicarán junto con la especificación OpenAPI oficial. Los valores mostrados son marcadores de posición.
        </Callout>
      </DocBlock>
    </>
  );
}
