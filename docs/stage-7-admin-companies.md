# Etapa 7 — empresas del superadmin

## Contrato conectado

La lista, el detalle y la acción de suspender o reactivar usan la API. Todas las rutas exigen `admin.companies`:

| Acción | Ruta |
| --- | --- |
| Buscar, filtrar, ordenar y paginar | `GET /v1/admin/empresas` |
| Ver perfil y actividad | `GET /v1/admin/empresas/{id}` |
| Suspender o reactivar | `PATCH /v1/admin/empresas/{id}/estado` |

Una migración agrega el estado de plataforma y un espacio para el nombre del plan. Los registros existentes con el asistente completo pasan a `ACTIVA`; los que aún no lo completan quedan en `ONBOARDING`. `SUSPENDIDA` se guarda en la base y la reactivación recupera el estado anterior. El estado de plataforma es independiente del ambiente DGII y de una futura suscripción.

La lista muestra los usuarios y comprobantes reales del mes actual. Si todavía no hay un plan o una suscripción, muestra «Sin plan» y «Sin suscripción registrada»; los módulos contratados quedan vacíos hasta conectar ese servicio. La sección de suscripción dejó de consultar datos simulados.

Una empresa suspendida no puede iniciar sesión ni renovar sesión. Sus tokens de usuario existentes y los tokens técnicos por certificado asociados a su RNC dejan de autorizar solicitudes mientras siga suspendida. El superadmin conserva acceso para reactivarla.

## Prueba manual propuesta

1. Entrar como SUPERADMIN y abrir `/admin/empresas`. Buscar por nombre o RNC, filtrar por estado y abrir una empresa. Confirmar nombre, RNC, fecha, usuarios y comprobantes del mes.
2. Elegir una **empresa de prueba** y pulsar «Suspender». Confirmar que cambia a `SUSPENDIDA` y que su usuario no puede iniciar sesión ni seguir usando una sesión abierta.
3. Pulsar «Reactivar». Confirmar que vuelve a su estado anterior y que el usuario puede iniciar sesión de nuevo.
4. Verificar que un usuario normal de empresa no puede consultar las rutas administrativas.

La prueba automática cubre búsqueda, datos reales, permisos, suspensión, bloqueo de sesiones y tokens de certificado, y reactivación. No envía comprobantes a la DGII.
