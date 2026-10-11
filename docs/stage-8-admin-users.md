# Etapa 8 — usuarios internos

## Contrato conectado

El módulo `/admin/usuarios` consulta y modifica usuarios de la API. Se retiraron sus datos simulados cuando el portal usa autenticación real. Todas las rutas requieren el permiso `admin.users`, reservado a SUPERADMIN.

| Acción | Ruta |
| --- | --- |
| Listar usuarios internos | `GET /v1/admin/usuarios` |
| Invitar usuario | `POST /v1/admin/usuarios` |
| Editar nombre, correo, rol y estado | `PUT /v1/admin/usuarios/{id}` |
| Reenviar invitación | `POST /v1/admin/usuarios/{id}/reenviar-invitacion` |
| Reenviar verificación del nuevo correo | `POST /v1/admin/usuarios/{id}/reenviar-verificacion` |

La invitación llega como correo HTML y permite definir la contraseña. Al editar un correo se envía otro enlace HTML al correo nuevo. El correo anterior mantiene el acceso hasta la confirmación; al confirmar, el nuevo pasa a ser el de acceso y se cierran las sesiones anteriores. El panel muestra el correo pendiente y permite reenviar el enlace. Si falla el envío, muestra una advertencia y deja el reenvío disponible.

La API impide desactivar la propia cuenta, cambiar el propio rol o dejar la plataforma sin un SUPERADMIN activo. El nombre y el rol se guardan aunque el nuevo correo siga pendiente.

## Prueba manual propuesta

1. Entrar como SUPERADMIN y abrir `/admin/usuarios`. Crear un usuario con un correo de prueba bajo tu control. Confirmar que llega la invitación con formato HTML y definir su contraseña.
2. Iniciar sesión con el nuevo usuario y comprobar que accede a las secciones de su rol. Un usuario SOPORTE, COMERCIAL o FINANZAS no debe poder abrir `/admin/usuarios` ni llamar sus rutas de la API.
3. Volver como SUPERADMIN. Cambiar el correo del usuario a otro correo de prueba. Confirmar que la lista muestra «Pendiente» y que el usuario puede seguir entrando con el correo anterior.
4. Abrir el enlace del correo nuevo. Confirmar que ya se puede iniciar sesión con él y que el correo anterior deja de funcionar. La sesión abierta antes del cambio debe pedir un nuevo inicio de sesión.
5. Probar «Reenviar invitación» o «Reenviar verificación» si hay enlaces pendientes. Comprobar que tu propia cuenta no permite editar su rol ni desactivarse desde el formulario.

La prueba automática cubre permisos, invitación, cambio de correo pendiente, reserva de direcciones, reenvío y confirmación. No modifica la emisión fiscal ni la vista de facturas.
