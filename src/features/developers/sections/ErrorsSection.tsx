import { OctagonAlert } from 'lucide-react';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { Callout, DocBlock, DocHeader, DocTable, InlineCode } from '../components/doc-ui';
import { HttpStatusBadge } from '../components/MethodBadge';

const CODES: [number, string, string, string][] = [
  [400, 'BAD_REQUEST', 'La solicitud está mal formada.', 'No. Corrige la solicitud.'],
  [401, 'UNAUTHORIZED', 'Token ausente, inválido o expirado.', 'Sí, tras renovar el token.'],
  [402, 'SUBSCRIPTION_INACTIVE', 'La suscripción de la empresa no está activa.', 'No.'],
  [403, 'FORBIDDEN', 'La credencial no tiene permisos para la operación.', 'No.'],
  [403, 'MODULE_NOT_CONTRACTED', 'El módulo de API no está incluido en el plan.', 'No.'],
  [404, 'NOT_FOUND', 'El recurso no existe.', 'No.'],
  [409, 'CONFLICT', 'Idempotency-Key reutilizada con un cuerpo distinto, o conflicto de estado.', 'No. Revisa la clave.'],
  [422, 'VALIDATION_ERROR', 'Los datos no superan las validaciones fiscales.', 'No. Corrige los campos.'],
  [429, 'RATE_LIMITED', 'Demasiadas solicitudes en poco tiempo.', 'Sí, con espera exponencial.'],
  [500, 'INTERNAL_ERROR', 'Error inesperado del servicio.', 'Solo con la misma Idempotency-Key.'],
  [503, 'SERVICE_UNAVAILABLE', 'Servicio o DGII temporalmente no disponible.', 'Solo con la misma Idempotency-Key.'],
];

const ERROR_BODY = `{
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "Revisa los datos ingresados.",
  "errors": [
    { "field": "comprador.rnc", "message": "El RNC debe tener 9 u 11 dígitos." },
    { "field": "items[0].cantidad", "message": "Debe ser mayor que cero." }
  ],
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}`;

export function ErrorsSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Errores" description="La API usa códigos HTTP estándar y un cuerpo de error uniforme." />

      <DocBlock title="Códigos HTTP">
        <DocTable
          minWidth={680}
          headers={['HTTP', 'Código', 'Descripción', '¿Reintentar?']}
          rows={CODES.map(([s, c, d, r]) => [
            <HttpStatusBadge key="s" status={s} />,
            <InlineCode key="c">{c}</InlineCode>,
            <span key="d" className="text-muted-foreground">{d}</span>,
            <span key="r" className="text-muted-foreground">{r}</span>,
          ])}
        />
      </DocBlock>

      <DocBlock title="Cuerpo de error" description="Incluye el traceId cuando contactes a soporte para agilizar el diagnóstico.">
        <CodeBlock lang="json" title="422 Unprocessable Entity — Ejemplo ilustrativo" code={ERROR_BODY} />
      </DocBlock>

      <DocBlock title="Reintentos seguros">
        <Callout tone="warning" icon={OctagonAlert} title="Nunca reintentes una emisión automáticamente sin Idempotency-Key">
          Si una solicitud de emisión falla por tiempo de espera o error de red, el comprobante pudo haberse emitido. Reintentar sin la misma{' '}
          <InlineCode>Idempotency-Key</InlineCode> puede generar comprobantes duplicados ante la DGII.
        </Callout>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground marker:text-brand">
          <li>Genera y guarda la Idempotency-Key antes de enviar la solicitud.</li>
          <li>En reintentos, usa exactamente la misma clave y el mismo cuerpo.</li>
          <li>Aplica espera exponencial con un límite de intentos.</li>
          <li>Los errores 4xx (excepto 401 y 429) no deben reintentarse sin corregir la solicitud.</li>
        </ul>
      </DocBlock>
    </>
  );
}
