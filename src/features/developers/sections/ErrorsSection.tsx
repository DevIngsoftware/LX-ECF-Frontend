import { OctagonAlert } from 'lucide-react';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { Callout, DocBlock, DocHeader, DocTable, InlineCode } from '../components/doc-ui';
import { HttpStatusBadge } from '../components/MethodBadge';

const CODES: [number, string, string, string][] = [
  [400, 'Solicitud inválida', 'Faltan datos o alguna regla de validación falla.', 'Corrige la solicitud.'],
  [401, 'Token inválido', 'El token técnico es inválido o expiró.', 'Obtén otro token.'],
  [403, 'Acceso denegado', 'La credencial no puede usar esta ruta.', 'Revisa credencial, ambiente y plan.'],
  [404, 'No encontrado', 'El comprobante no existe para la empresa de la credencial.', 'Revisa el e-NCF.'],
  [409, 'Conflicto', 'La operación no es válida en el estado actual o la clave de idempotencia entra en conflicto.', 'Revisa el estado y la clave.'],
  [502, 'Error de integración', 'Falló una comunicación con un servicio fiscal externo.', 'Consulta el estado antes de reintentar.'],
  [500, 'Error interno', 'Ocurrió un fallo inesperado.', 'Consulta el estado antes de reintentar.'],
];

const ERROR_BODY = `{
  "error": "El RNC o la cédula debe tener 9 u 11 dígitos"
}`;

export function ErrorsSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Errores" description="La API usa códigos HTTP estándar. El contenido de la respuesta depende del tipo de error." />

      <DocBlock title="Códigos HTTP">
        <DocTable
          minWidth={680}
          headers={['HTTP', 'Resultado', 'Descripción', 'Siguiente paso']}
          rows={CODES.map(([s, c, d, r]) => [
            <HttpStatusBadge key="s" status={s} />,
            <InlineCode key="c">{c}</InlineCode>,
            <span key="d" className="text-muted-foreground">{d}</span>,
            <span key="r" className="text-muted-foreground">{r}</span>,
          ])}
        />
      </DocBlock>

      <DocBlock title="Cuerpo de error" description="Los errores de validación propios de la API incluyen un campo error. Otros fallos pueden usar una estructura distinta.">
        <CodeBlock lang="json" title="400 Bad Request — Ejemplo" code={ERROR_BODY} />
        <p className="text-sm text-muted-foreground">El endpoint de prevalidación devuelve HTTP 200 con <InlineCode>valid: false</InlineCode> y una lista de mensajes cuando el formulario no supera sus reglas.</p>
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
          <li>Los errores 4xx no deben reintentarse sin corregir la causa; ante 401, renueva el token.</li>
        </ul>
      </DocBlock>
    </>
  );
}
