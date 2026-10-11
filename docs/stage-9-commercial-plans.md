# Etapa 9 — catálogo de planes

## Contrato conectado

Los planes del panel se guardan en la API con los campos del formulario existente: nombre, descripción, precio publicado, límites de comprobantes y usuarios, módulos, estado y destacado. No se generan planes de muestra. El precio publicado sigue siendo texto; si está vacío, la interfaz muestra «Consultar».

| Acción | Ruta | Permiso |
| --- | --- | --- |
| Listar todos los planes | `GET /v1/admin/planes` | `admin.plans` |
| Crear plan | `POST /v1/admin/planes` | `admin.plans.write` |
| Editar plan | `PUT /v1/admin/planes/{id}` | `admin.plans.write` |
| Ver planes disponibles desde una empresa | `GET /v1/planes` | `billing.manage` |

SUPERADMIN y COMERCIAL pueden editar. FINANZAS puede consultar, pero no editar. Los usuarios de empresa ven solo los planes activos. Esta etapa conecta el catálogo; contratar un plan, registrar suscripciones y simular pagos pertenecen al siguiente módulo. Ningún plan se asigna automáticamente a una empresa.

## Prueba manual propuesta

1. Entrar como SUPERADMIN o COMERCIAL y abrir `/admin/planes`. Crear un plan de prueba con precio, límites y dos módulos. Recargar y confirmar que permanece.
2. Editarlo, cambiar los límites y desactivarlo. Confirmar que sigue visible en el panel, marcado como inactivo.
3. Entrar como FINANZAS. Confirmar que ve los planes, pero no aparecen los botones de crear o editar.
4. Entrar con una empresa y abrir `/app/suscripcion`. Confirmar que el plan activo aparece en la comparación y que el inactivo no aparece. Las demás secciones de suscripción aún no están conectadas y pueden mostrar un error de servicio.

La prueba automática cubre permisos de edición, persistencia, módulos y la visibilidad de planes activos. No interactúa con la DGII ni con la emisión fiscal.
