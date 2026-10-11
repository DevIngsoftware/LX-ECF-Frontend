/** Contrato técnico verificado contra PortalInvoiceRequest y DeveloperInvoicesController. */
export interface EndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  headers?: { name: string; value: string; required: boolean; note: string }[];
  request?: string;
  response: string;
  responseStatus: number;
}

const AUTH_HEADER = { name: 'Authorization', value: 'Bearer {accessToken}', required: true, note: 'Token técnico obtenido en POST /v1/api-keys/token.' };
const BASE = '/v1/api-client/facturas';

export const EMIT_REQUEST = `{
  "tipoEcf": "E31",
  "rncComprador": "101123456",
  "razonSocialComprador": "Cliente de prueba",
  "tipoIngresos": "01",
  "tipoPago": "1",
  "items": [
    {
      "descripcion": "Servicio de ejemplo",
      "indicadorBienServicio": "2",
      "cantidad": 1,
      "precioUnitario": 1000.00,
      "descuento": 0,
      "tasaItbis": 18
    }
  ]
}`;

export const EMIT_RESPONSE = `{
  "id": "E317000000001",
  "encf": "E317000000001",
  "internalStatus": "CREADO",
  "dgiiStatus": "NO_ENVIADO",
  "messages": []
}`;

export const ENDPOINTS_DOC: EndpointDoc[] = [
  {
    id: 'validate', method: 'POST', path: `${BASE}/validar`, summary: 'Validar formulario',
    description: 'Valida los datos antes de reservar un e-NCF. No envía el comprobante.',
    headers: [AUTH_HEADER, { name: 'Content-Type', value: 'application/json', required: true, note: 'Cuerpo en JSON.' }],
    request: EMIT_REQUEST,
    response: `{ "valid": true, "messages": [] }`, responseStatus: 200,
  },
  {
    id: 'emit', method: 'POST', path: BASE, summary: 'Crear comprobante',
    description: 'Crea un comprobante para la empresa de la credencial. Devuelve un e-NCF; el envío a la DGII es una operación separada.',
    headers: [AUTH_HEADER,
      { name: 'Idempotency-Key', value: '{uuid}', required: true, note: 'Reutiliza la misma clave al reintentar la misma emisión.' },
      { name: 'Content-Type', value: 'application/json', required: true, note: 'Cuerpo en JSON.' }],
    request: EMIT_REQUEST, response: EMIT_RESPONSE, responseStatus: 200,
  },
  {
    id: 'list', method: 'GET', path: BASE, summary: 'Listar comprobantes',
    description: 'Devuelve los comprobantes de la empresa de forma paginada. Admite page, size, search, type, internalStatus, dgiiStatus, sort, direction, from y to.',
    headers: [AUTH_HEADER],
    response: `{\n  "content": [{ "id": "E317000000001", "encf": "E317000000001", "dgiiStatus": "NO_ENVIADO" }],\n  "page": 0,\n  "size": 20,\n  "totalElements": 1,\n  "totalPages": 1\n}`,
    responseStatus: 200,
  },
  {
    id: 'detail', method: 'GET', path: `${BASE}/{eNcf}`, summary: 'Consultar comprobante',
    description: 'Obtiene detalle, comprador, artículos y estados del e-NCF indicado. Solo devuelve comprobantes de la empresa de la credencial.',
    headers: [AUTH_HEADER], response: `{ "id": "E317000000001", "encf": "E317000000001", "buyer": { "name": "Cliente de prueba", "rnc": "101123456" }, "items": [], "internalStatus": "CREADO", "dgiiStatus": "NO_ENVIADO" }`, responseStatus: 200,
  },
  {
    id: 'send', method: 'POST', path: `${BASE}/{eNcf}/enviar`, summary: 'Enviar a la DGII',
    description: 'Genera y firma el XML si es necesario y lo envía a la DGII usando el ambiente fiscal configurado para la empresa.',
    headers: [AUTH_HEADER], response: `{ "id": "E317000000001", "encf": "E317000000001", "internalStatus": "EN_PROCESO", "dgiiStatus": "EN_PROCESO" }`, responseStatus: 200,
  },
  {
    id: 'status', method: 'GET', path: `${BASE}/{eNcf}/estado`, summary: 'Consultar estado DGII',
    description: 'Consulta la DGII usando el track ID guardado por la API. Requiere que el comprobante ya haya sido enviado.',
    headers: [AUTH_HEADER], response: `{ "trackId": "track-id-de-la-dgii", "dgiiStatus": "ACEPTADO", "messages": [], "checkedAt": "2026-10-11T12:00:00Z" }`, responseStatus: 200,
  },
  {
    id: 'pdf', method: 'GET', path: `${BASE}/{eNcf}/pdf`, summary: 'Ver PDF',
    description: 'Devuelve la representación impresa actual del backend.', headers: [AUTH_HEADER],
    response: `HTTP/1.1 200 OK\nContent-Type: application/pdf\nContent-Disposition: inline; filename="E317000000001.pdf"`, responseStatus: 200,
  },
  {
    id: 'xml', method: 'GET', path: `${BASE}/{eNcf}/xml`, summary: 'Descargar XML firmado',
    description: 'Devuelve el XML firmado. Requiere que el comprobante ya esté firmado.', headers: [AUTH_HEADER],
    response: `HTTP/1.1 200 OK\nContent-Type: application/xml`, responseStatus: 200,
  },
];
