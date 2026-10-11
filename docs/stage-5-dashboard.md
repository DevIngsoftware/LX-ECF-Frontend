# Etapa 5 — panel inicial

## Contrato conectado

El panel solicita `GET /v1/dashboard/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` con la sesión del portal. La API exige `invoices.read` y calcula el resumen exclusivamente con los comprobantes de la empresa autenticada cuya fecha de emisión está en el rango, incluidos ambos extremos. El frontend envía fechas locales para que «este mes» coincida con las fechas de emisión que muestra la lista.

| Campo | Cálculo |
| --- | --- |
| `totalInvoiced` | Suma de `montoTotal` de todos los comprobantes registrados en el período, con cualquier estado. No representa cobros. |
| `invoicesIssued` | Cantidad de comprobantes registrados en el período. |
| `accepted` | Cantidad con estado `ACEPTADO` o `ACEPTADO_CONDICIONAL`. |
| `pending` | Cantidad creada, firmada, enviada o en proceso de respuesta DGII. |
| `alerts` | Configuración DGII incompleta, certificado próximo a vencer, rechazos y pendientes reales. |

La lista de comprobantes recientes ya usaba la API. Ahora las cuatro cifras y alertas también la usan. Si el servidor falla, el panel presenta el error y permite reintentar; si no hay datos, muestra cero y el estado vacío, sin cifras de demostración. Cobros y cuentas por cobrar esperan la integración de sus módulos.

## Prueba manual propuesta

1. Iniciar sesión y abrir el panel en `/app`. Confirmar que las cifras corresponden a los comprobantes de la empresa emitidos este mes y que «Comprobantes recientes» abre documentos reales.
2. Registrar una factura de prueba sin enviarla a DGII. Volver al panel y verificar que aumentan «Facturado», «Comprobantes» y «Pendientes»; «Aceptados» no debe aumentar.
3. Revisar las alertas: una empresa sin configuración fiscal completa debe ver el enlace al asistente. Si hay comprobantes rechazados en el mes, debe aparecer la alerta correspondiente.
4. Con una empresa sin comprobantes este mes, comprobar que las cifras son cero y la lista reciente muestra su estado vacío cuando tampoco tiene comprobantes históricos.

No es necesario enviar documentos a la DGII para probar esta etapa. La prueba automática verifica rango de fechas, separación entre empresas, estados, alertas, rango inválido y acceso sin sesión.
