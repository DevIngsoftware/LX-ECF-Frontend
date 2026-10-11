# Etapa 10 — suscripciones y pago simulado

## Contrato conectado

La selección de un plan activo en `/app/suscripcion` registra una operación **simulada** en la API y activa una suscripción `PRUEBA` durante 30 días desde esa operación. No solicita tarjeta, no cobra dinero y no crea una factura de servicio. Un segundo clic sobre el mismo plan vigente devuelve la suscripción existente sin duplicar la operación.

| Acción | Ruta |
| --- | --- |
| Consultar suscripción de la empresa | `GET /v1/suscripcion` |
| Simular pago y activar un plan | `POST /v1/suscripcion/pago-simulado` |
| Ver operaciones simuladas | `GET /v1/suscripcion/pagos` |
| Ver facturas de servicio reales | `GET /v1/suscripcion/facturas` |
| Consultar suscripciones del panel | `GET /v1/admin/suscripciones` |

La API guarda una copia del nombre, límites y módulos del plan al activarlo, de modo que editar el catálogo no modifica una suscripción existente. El portal muestra uso real de comprobantes y usuarios. Los módulos contratados pasan a la sesión del usuario. El panel de empresas muestra el plan y sus módulos reales. Si no hay suscripción, la pantalla lo dice; los historiales muestran estados vacíos.

La simulación está deshabilitada por defecto. Para probarla en desarrollo, iniciar la API con `LX_PAYMENTS_SIMULATION_ENABLED=true`. Mantener esta variable desactivada en producción. El historial identifica expresamente cada operación como simulada y sin cobro. Cuando llegue la integración con Azul, deberá reemplazarse este flujo por confirmaciones reales antes de permitir pagos de producción.

## Prueba manual propuesta

1. Iniciar la API con `LX_PAYMENTS_SIMULATION_ENABLED=true`, volver a iniciar sesión e ir a `/app/suscripcion`. Si todavía no hay planes, crear primero uno activo en `/admin/planes`.
2. Elegir un plan y pulsar «Simular pago». Confirmar que se muestra como `PRUEBA`, con vencimiento 30 días después, sus límites y módulos.
3. Recargar. Confirmar que el plan y la operación siguen ahí. El historial de pagos debe mostrar una referencia `SIM-...` y «Simulado · sin cobro»; facturas de servicio debe seguir vacío.
4. Entrar como SUPERADMIN y revisar `/admin/suscripciones` y la ficha de esa empresa. Confirmar plan, estado, renovación y módulos.
5. Reiniciar sin `LX_PAYMENTS_SIMULATION_ENABLED=true` y comprobar con una empresa de prueba que una nueva simulación queda bloqueada. No probar con una transacción fiscal real.

La prueba automática cubre autorización, activación por 30 días, idempotencia, módulos de sesión, historial simulado, ausencia de factura ficticia y consulta administrativa. Las acciones para suspender o cancelar una suscripción desde el panel permanecen deshabilitadas hasta definir e implementar sus transiciones.
