# Etapa 12 — credenciales técnicas para desarrolladores

## Contrato conectado

El portal de Integraciones crea y revoca credenciales técnicas reales. Cada una pertenece a la empresa, tiene nombre y ambiente, y se identifica con una API Key pública y un API Secret privado. El diálogo muestra ambos valores al crearlos; el secreto se conserva solo como hash en la API y no vuelve a entregarse. La lista muestra únicamente un prefijo de la clave.

| Acción | Ruta | Autenticación |
| --- | --- | --- |
| Listar credenciales | `GET /v1/api-keys` | Usuario de empresa con `developers.manage` |
| Crear credencial | `POST /v1/api-keys` | Usuario de empresa con `developers.manage` |
| Revocar credencial | `PATCH /v1/api-keys/{id}/revocar` | Usuario de empresa con `developers.manage` |
| Intercambiar clave y secreto | `POST /v1/api-keys/token` | API Key y API Secret |
| Comprobar identidad del token | `GET /v1/api-client/identity` | Token técnico Bearer |

El token técnico dura 15 minutos. Revocar la credencial lo invalida de inmediato, incluso antes de que venza. El ambiente `sandbox` corresponde a TesteCF o CerteCF; `production` solo puede crearse y usarse cuando la empresa está configurada en eCF. El intercambio exige una suscripción vigente que incluya el módulo API y una empresa no suspendida. El token técnico no otorga permisos del portal de personas.

Esta etapa establece la autenticación técnica y la consulta de identidad. La emisión y consulta fiscal mediante este token se conectarán por rutas técnicas propias en la siguiente etapa; las rutas del portal web siguen exigiendo sesión de usuario.

## Prueba manual propuesta

1. Crear un plan activo con módulo API, activarlo desde una empresa de prueba mediante pago simulado y entrar en `/app/integraciones`.
2. Crear una credencial `sandbox` mientras la empresa está en TesteCF o CerteCF. Copiar API Key y API Secret. Confirmar que, al cerrar el diálogo, solo queda visible el prefijo.
3. Desde un terminal o cliente API, enviar ambos a `POST /v1/api-keys/token`. Confirmar que responde un Bearer con `expiresIn: 900` y que `GET /v1/api-client/identity` devuelve el RNC y ambiente correctos.
4. Probar un secreto incorrecto. Debe devolver 401. Intentar crear una credencial `production` mientras la empresa sigue en pruebas. Debe ser rechazada.
5. Revocar la credencial. El Bearer anterior y un nuevo intercambio deben responder 401.

La prueba automática cubre esos flujos y comprueba que el token técnico no entra a las rutas del portal. No envía e-CF a la DGII.
