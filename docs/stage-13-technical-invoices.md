# Etapa 13 — comprobantes para integraciones técnicas

## Contrato conectado

La credencial de desarrollador intercambia API Key y API Secret por un Bearer de 15 minutos. Con ese Bearer, `/v1/api-client/facturas` permite validar, crear, listar, consultar, enviar a la DGII, consultar estado y obtener PDF o XML. El RNC se toma de la credencial verificada en la API; el cliente no puede elegirlo en el cuerpo ni en la URL. Una credencial revocada, de empresa suspendida, de ambiente distinto al fiscal actual o sin suscripción vigente al módulo API deja de funcionar.

| Acción | Ruta | Observación |
| --- | --- | --- |
| Validar formulario | `POST /v1/api-client/facturas/validar` | No reserva e-NCF. |
| Crear comprobante | `POST /v1/api-client/facturas` | Exige `Idempotency-Key`; crea el e-NCF, sin enviarlo. |
| Listar | `GET /v1/api-client/facturas` | Solo empresa de la credencial. |
| Consultar | `GET /v1/api-client/facturas/{eNcf}` | Devuelve 404 para un e-NCF de otra empresa. |
| Enviar a DGII | `POST /v1/api-client/facturas/{eNcf}/enviar` | Usa el ambiente fiscal de la empresa. |
| Consultar estado | `GET /v1/api-client/facturas/{eNcf}/estado` | Requiere un envío previo; la API utiliza el track ID guardado. |
| Ver PDF | `GET /v1/api-client/facturas/{eNcf}/pdf` | Reutiliza el renderizador actual. |
| Descargar XML | `GET /v1/api-client/facturas/{eNcf}/xml` | Requiere que el XML esté firmado. |

La emisión y la vista de factura existentes no se modificaron. La documentación del portal de desarrolladores se actualizó con las rutas y nombres de campo reales.

## Prueba manual propuesta

1. En una empresa de pruebas, verifica que tengas suscripción vigente con módulo API, datos fiscales y una secuencia E31. Crea una credencial `sandbox` en Integraciones, guarda su API Key y API Secret y solicita un token mediante `POST /v1/api-keys/token`.
2. Con el Bearer, llama a `GET /v1/api-client/facturas?size=5`. Debe devolver solo las facturas de esa empresa. El mismo token no debe acceder a `/v1/portal/facturas`.
3. En la sección de ejemplos de desarrolladores, toma el cuerpo E31 y prueba `POST /v1/api-client/facturas/validar`. Después crea un comprobante con `Idempotency-Key` y repite exactamente la solicitud con la misma clave: debe devolverte el mismo e-NCF, sin consumir otra secuencia.
4. Consulta el detalle y el PDF del e-NCF. El XML todavía no estará disponible hasta que se firme. Envía a la DGII **solo si deseas probar el flujo fiscal en el ambiente de pruebas de esa empresa**; después consulta el estado mediante el e-NCF.
5. Revoca la credencial. El token técnico existente debe quedar invalidado inmediatamente.

La prueba automática verificó autenticación técnica, listado propio, detalle propio, aislamiento de comprobantes ajenos, rechazo de una sesión humana en rutas técnicas y revocación. No envía comprobantes a la DGII.
