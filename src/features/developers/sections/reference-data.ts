/** Contratos ilustrativos hasta la publicación de la especificación OpenAPI oficial. */
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

const AUTH_HEADER = { name: 'Authorization', value: 'Bearer {token}', required: true, note: 'Token de acceso vigente.' };

export const EMIT_REQUEST = `{
  "tipoEcf": "E31",
  "comprador": {
    "rnc": "101000000",
    "razonSocial": "Cliente Ejemplo, S.R.L."
  },
  "tipoIngreso": "01",
  "tipoPago": "1",
  "items": [
    {
      "descripcion": "Servicio de ejemplo",
      "cantidad": 1,
      "precioUnitario": 1000.00,
      "itbis": 18
    }
  ]
}`;

export const EMIT_RESPONSE = `{
  "id": "8f1c2b7e-0000-0000-0000-000000000000",
  "encf": "E310000000001",
  "estadoInterno": "CREADO",
  "estadoDgii": "EN_PROCESO",
  "trackId": "00000000-0000-0000-0000-000000000000",
  "fechaEmision": "2026-01-15T14:32:10-04:00",
  "total": 1180.00
}`;

export const ENDPOINTS_DOC: EndpointDoc[] = [
  {
    id: 'emit',
    method: 'POST',
    path: '/v1/ecf',
    summary: 'Emitir comprobante',
    description: 'Crea, firma y envía un e-CF a la DGII. La respuesta es inmediata; el estado DGII puede quedar en proceso.',
    headers: [
      AUTH_HEADER,
      { name: 'Idempotency-Key', value: '{uuid}', required: true, note: 'Identificador único por intento lógico de emisión. Reutilízalo en los reintentos.' },
      { name: 'Content-Type', value: 'application/json', required: true, note: 'Cuerpo en JSON.' },
    ],
    request: EMIT_REQUEST,
    response: EMIT_RESPONSE,
    responseStatus: 201,
  },
  {
    id: 'list',
    method: 'GET',
    path: '/v1/ecf',
    summary: 'Listar comprobantes',
    description: 'Devuelve los comprobantes emitidos de forma paginada. Admite los parámetros page, size, desde, hasta y tipoEcf.',
    headers: [AUTH_HEADER],
    response: `{
  "content": [ { "id": "8f1c2b7e-...", "encf": "E310000000001", "estadoDgii": "ACEPTADO" } ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}`,
    responseStatus: 200,
  },
  {
    id: 'detail',
    method: 'GET',
    path: '/v1/ecf/{id}',
    summary: 'Consultar comprobante',
    description: 'Obtiene el detalle completo de un comprobante, incluyendo montos, comprador y estados.',
    headers: [AUTH_HEADER],
    response: EMIT_RESPONSE,
    responseStatus: 200,
  },
  {
    id: 'status',
    method: 'GET',
    path: '/v1/ecf/{id}/estado',
    summary: 'Consultar estado DGII',
    description: 'Devuelve el estado interno, el estado DGII y los mensajes de validación más recientes.',
    headers: [AUTH_HEADER],
    response: `{
  "estadoInterno": "ACEPTADO",
  "estadoDgii": "ACEPTADO_CONDICIONAL",
  "mensajes": [
    { "codigo": "0", "valor": "Mensaje de validación de ejemplo" }
  ],
  "actualizadoEn": "2026-01-15T14:35:02-04:00"
}`,
    responseStatus: 200,
  },
  {
    id: 'pdf',
    method: 'GET',
    path: '/v1/ecf/{id}/pdf',
    summary: 'Descargar representación impresa',
    description: 'Devuelve el PDF del comprobante. Responde con Content-Type application/pdf.',
    headers: [AUTH_HEADER],
    response: `HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="E310000000001.pdf"`,
    responseStatus: 200,
  },
  {
    id: 'xml',
    method: 'GET',
    path: '/v1/ecf/{id}/xml',
    summary: 'Descargar XML firmado',
    description: 'Devuelve el XML firmado digitalmente tal como fue enviado a la DGII.',
    headers: [AUTH_HEADER],
    response: `HTTP/1.1 200 OK
Content-Type: application/xml`,
    responseStatus: 200,
  },
];
