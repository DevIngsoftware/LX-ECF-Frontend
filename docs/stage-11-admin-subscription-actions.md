# Etapa 11 — acciones administrativas de suscripciones

## Contrato conectado

En `/admin/suscripciones`, los usuarios SUPERADMIN y COMERCIAL pueden suspender, reactivar o cancelar una suscripción desde el menú de acciones. FINANZAS puede consultar la lista, pero no cambiar estados. La API protege `PATCH /v1/admin/suscripciones/{id}/estado` con `admin.plans.write`.

- **Suspender** una suscripción vigente retira sus módulos al renovar la sesión. Conserva la fecha de vencimiento y el estado anterior.
- **Reactivar** una suscripción suspendida y todavía vigente recupera ese estado anterior. Una suscripción vencida requiere una nueva operación de prueba de la empresa.
- **Cancelar** conserva el historial de pagos simulados. Para volver a activar un plan, la empresa debe elegirlo y registrar otra operación simulada.

El cambio de suscripción no modifica el ambiente DGII ni el estado fiscal de la empresa. Suspender el acceso completo a la plataforma sigue siendo una acción distinta en la ficha de la empresa.

## Prueba manual propuesta

1. Usar una **empresa de prueba** con una suscripción de prueba vigente. Entrar como SUPERADMIN o COMERCIAL y abrir `/admin/suscripciones`.
2. Suspenderla. Confirmar que la tabla muestra `SUSPENDIDA`. Recargar la sesión de la empresa y comprobar que sus módulos contratados ya no aparecen.
3. Reactivarla antes del vencimiento. Confirmar que vuelve a `PRUEBA` y que los módulos reaparecen al renovar la sesión.
4. Cancelarla. Confirmar `CANCELADA` y que el historial simulado sigue disponible. Desde la empresa, elegir el plan otra vez y registrar una nueva operación de prueba.
5. Entrar como FINANZAS y confirmar que puede ver suscripciones sin menú para cambiarlas.

La prueba automática cubre permisos, suspensión, recuperación del estado anterior, cancelación y activación nueva. No envía pagos reales ni comprobantes a la DGII.
