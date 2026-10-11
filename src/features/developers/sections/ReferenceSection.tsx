import { FileWarning } from 'lucide-react';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Callout, DocBlock, DocHeader, DocTable, InlineCode } from '../components/doc-ui';
import { HttpStatusBadge, MethodBadge } from '../components/MethodBadge';
import { ENDPOINTS_DOC } from './reference-data';

export function ReferenceSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Documentación de endpoints" description="Operaciones disponibles para emitir y consultar comprobantes fiscales electrónicos." />

      <div className="mb-8">
        <Callout tone="warning" icon={FileWarning} title="Contratos ilustrativos hasta la publicación de OpenAPI oficial">
          Rutas, nombres de campos y códigos pueden cambiar. Valida tu integración contra la especificación oficial cuando esté disponible.
        </Callout>
      </div>

      <DocBlock title="Endpoints" description="Selecciona un endpoint para ver los encabezados, la solicitud y la respuesta de ejemplo.">
        <Accordion type="multiple" className="surface divide-y overflow-hidden">
          {ENDPOINTS_DOC.map((e) => (
            <AccordionItem key={e.id} value={e.id} className="border-b-0 px-4">
              <AccordionTrigger className="gap-3 py-4 hover:no-underline">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MethodBadge method={e.method} />
                    <code className="truncate font-mono text-sm font-medium">{e.path}</code>
                  </div>
                  <span className="text-sm font-normal text-muted-foreground sm:ml-auto sm:pr-2">{e.summary}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <p className="text-sm text-muted-foreground">{e.description}</p>
                {e.headers && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Encabezados</h4>
                    <DocTable
                      minWidth={520}
                      headers={['Nombre', 'Valor', 'Requerido', 'Descripción']}
                      rows={e.headers.map((h) => [
                        <InlineCode key="n">{h.name}</InlineCode>,
                        <span key="v" className="font-mono text-xs text-muted-foreground">{h.value}</span>,
                        h.required ? <Badge key="r" variant="brand">Sí</Badge> : <Badge key="r" variant="neutral">No</Badge>,
                        <span key="d" className="text-muted-foreground">{h.note}</span>,
                      ])}
                    />
                  </div>
                )}
                {e.request && <CodeBlock lang="json" title="Solicitud — Ejemplo ilustrativo" code={e.request} />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Respuesta <HttpStatusBadge status={e.responseStatus} />
                  </div>
                  <CodeBlock lang={e.response.startsWith('HTTP') ? 'http' : 'json'} title="Respuesta — Ejemplo ilustrativo" code={e.response} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DocBlock>

      <DocBlock title="Idempotencia en la emisión">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Toda solicitud <InlineCode>POST /v1/ecf</InlineCode> debe incluir el encabezado <InlineCode>Idempotency-Key</InlineCode> con un
          identificador único (por ejemplo, un UUID v4) generado por tu sistema para cada comprobante. Si la conexión falla y repites la solicitud
          con la misma clave, la API devuelve el resultado original en lugar de emitir un comprobante duplicado.
        </p>
      </DocBlock>
    </>
  );
}
