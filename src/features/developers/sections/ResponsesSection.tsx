import { CodeBlock } from '@/components/shared/CodeBlock';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DGII_STATUS_META, INTERNAL_STATUS_META } from '@/constants/ecf';
import { Callout, DocBlock, DocHeader, DocTable, InlineCode } from '../components/doc-ui';
import { EMIT_RESPONSE } from './reference-data';

const FIELDS: [string, string, string][] = [
  ['id', 'string (UUID)', 'Identificador interno del comprobante en la plataforma.'],
  ['encf', 'string', 'Número de comprobante fiscal electrónico asignado.'],
  ['estadoInterno', 'string', 'Estado del procesamiento dentro de la plataforma.'],
  ['estadoDgii', 'string', 'Último estado informado por la DGII.'],
  ['trackId', 'string', 'Identificador de seguimiento devuelto por la DGII.'],
  ['fechaEmision', 'string (ISO 8601)', 'Fecha y hora de emisión con zona horaria.'],
  ['total', 'number', 'Monto total del comprobante en RD$.'],
];

const INTERNAL_NOTES: Record<string, string> = {
  CREADO: 'El comprobante fue registrado y está en procesamiento.',
  ACEPTADO: 'El procesamiento interno concluyó correctamente.',
  RECHAZADO: 'El comprobante no superó las validaciones internas.',
};

const DGII_NOTES: Record<string, string> = {
  ACEPTADO: 'La DGII aceptó el comprobante. Es definitivo.',
  ACEPTADO_CONDICIONAL: 'Aceptado con observaciones. Revisa los mensajes de validación.',
  RECHAZADO: 'La DGII rechazó el comprobante. Corrige y emite uno nuevo.',
  EN_PROCESO: 'La DGII aún no responde. Consulta el estado más tarde.',
  NO_ENVIADO: 'El comprobante todavía no se ha remitido a la DGII.',
};

export function ResponsesSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Respuestas" description="Estructura de las respuestas y significado de los estados de un comprobante." />

      <DocBlock title="Respuesta de emisión">
        <CodeBlock lang="json" title="201 Created — Ejemplo ilustrativo" code={EMIT_RESPONSE} />
        <DocTable
          headers={['Campo', 'Tipo', 'Descripción']}
          rows={FIELDS.map(([f, t, d]) => [
            <InlineCode key="f">{f}</InlineCode>,
            <span key="t" className="whitespace-nowrap font-mono text-xs text-muted-foreground">{t}</span>,
            <span key="d" className="text-muted-foreground">{d}</span>,
          ])}
        />
      </DocBlock>

      <DocBlock
        title="Estado interno y estado DGII"
        description="Son independientes: un comprobante puede estar procesado internamente y seguir en proceso en la DGII."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Estado interno (estadoInterno)</h3>
            <DocTable
              minWidth={360}
              headers={['Valor', 'Significado']}
              rows={Object.entries(INTERNAL_STATUS_META).map(([k, m]) => [
                <div key="v" className="space-y-1.5">
                  <InlineCode>{k}</InlineCode>
                  <div><StatusBadge label={m.label} tone={m.tone} /></div>
                </div>,
                <span key="d" className="text-muted-foreground">{INTERNAL_NOTES[k] ?? '—'}</span>,
              ])}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Estado DGII (estadoDgii)</h3>
            <DocTable
              minWidth={360}
              headers={['Valor', 'Significado']}
              rows={Object.entries(DGII_STATUS_META).map(([k, m]) => [
                <div key="v" className="space-y-1.5">
                  <InlineCode>{k}</InlineCode>
                  <div><StatusBadge label={m.label} tone={m.tone} /></div>
                </div>,
                <span key="d" className="text-muted-foreground">{DGII_NOTES[k] ?? '—'}</span>,
              ])}
            />
          </div>
        </div>
        <Callout tone="info">
          Trata cualquier valor desconocido como no definitivo y consulta nuevamente el estado. La API puede incorporar estados nuevos.
        </Callout>
      </DocBlock>
    </>
  );
}
