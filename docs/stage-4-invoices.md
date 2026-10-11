# Etapa 4 — comprobantes del portal

## Contrato conectado

El formulario del frontend define los campos de entrada. La API recibe esos campos en `/v1/portal/facturas`, los valida y los convierte al modelo fiscal existente. La asignación de e-NCF, los cálculos fiscales, la firma, el envío y el PDF siguen en la API. La plantilla `factura.html` y `PdfService` no cambiaron.

| Acción | Ruta | Resultado |
| --- | --- | --- |
| Listar y filtrar | `GET /v1/portal/facturas` | Página de comprobantes de la empresa autenticada |
| Detalle | `GET /v1/portal/facturas/{encf}` | Datos fiscales y campos guardados del formulario |
| Validar | `POST /v1/portal/facturas/validar` | Errores del formulario y de la estrategia fiscal, sin consumir secuencia |
| Guardar borrador | `POST /v1/portal/facturas/borradores` | ID de borrador privado de la empresa |
| Registrar | `POST /v1/portal/facturas` | e-NCF asignado; requiere `Idempotency-Key` |
| Enviar | `POST /v1/portal/facturas/{encf}/enviar` | Firma el XML y envía a la DGII; acción separada |
| Consultar estado | `GET /v1/portal/facturas/{encf}/estado` | Consulta DGII solo si ya existe track ID |
| Descargar PDF/XML | `GET /v1/portal/facturas/{encf}/pdf` y `/xml` | PDF del backend y XML firmado |

El registro y el envío son decisiones separadas en la pantalla. Un reintento de registro con la misma clave y el mismo contenido devuelve el e-NCF anterior; la misma clave con contenido diferente devuelve conflicto. El frontend conserva la clave del intento en `sessionStorage` mientras no haya respuesta definitiva. Todos los accesos a comprobantes se acotan al RNC de la sesión y respetan `invoices.read` / `invoices.emit`.

En la vista «Documento» el portal muestra el PDF generado por la API y la impresión usa ese PDF. La búsqueda de compradores del directorio de demostración se oculta mientras ese módulo siga pendiente; los datos del comprador se ingresan directamente.

## Reglas que impiden un registro fiscal incorrecto

- E32 admite comprador sin RNC solo si el monto es menor de RD$250,000; los importes mayores requieren RNC o cédula.
- E46/E47 requieren identificación extranjera y líneas sin ITBIS.
- E31/E33/E34/E41 admiten los importes de retención del formulario. E47 admite ISR retenido. La API rechaza retenciones que su representación fiscal actual no soporta, incluidas las de E44/E45 y el ITBIS retenido en E47.
- Las notas E33/E34 requieren los datos del comprobante modificado. La razón admite los 250 caracteres del formulario.
- El XML solo puede descargarse después de firmarlo. Consultar estado DGII requiere un track ID.

## Prueba manual propuesta

1. Iniciar sesión con un usuario con permisos de facturación y confirmar una secuencia E31 vigente en Centro DGII.
2. Abrir «Nueva factura», capturar un comprador y una línea, y pulsar «Validar borrador». Corregir cualquier error indicado.
3. Pulsar «Registrar comprobante». Confirmar que el detalle muestra un e-NCF real, los importes y «No enviado»; volver a la lista y encontrarlo con búsqueda y filtros.
4. Abrir «Documento» y comparar el PDF embebido con el PDF descargado. Antes del envío, XML y consulta de estado deben permanecer deshabilitados.
5. Si deseas probar la integración DGII en **TesteCF**, pulsar «Enviar a DGII» una sola vez y revisar el track ID, el XML firmado y «Consultar estado». No es necesario enviar para validar el registro y el PDF.
6. Repetir con E32 sin RNC y una nota E33/E34 referida a una factura de prueba, según las secuencias disponibles.

No se envió ningún comprobante a DGII durante las pruebas automáticas. El panel inicial y los otros módulos pendientes conservan su aviso de demostración.

## Verificación realizada

- `./mvnw test`: 18 pruebas pasan. Las pruebas de esta etapa comprobaron idempotencia, consumo único de secuencia, aislamiento por empresa, rutas HTTP autenticadas, E32 sin RNC, salida PDF y estructura XML E31/E32 contra sus XSD antes de la firma.
- `npm run build`: compila el frontend.
- `factura.html` y `PdfService` conservan sus hashes SHA-256 de la etapa 1. Se generó un PDF válido con una factura nueva. No hay una comparación visual automatizada con un PDF previo de la misma factura.
- La firma y el envío a los servicios DGII no se ejecutaron en las pruebas automáticas; dependen del certificado y ambiente de la empresa.
