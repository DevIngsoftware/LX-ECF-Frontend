# Etapa 6 — resumen del superadmin

## Contrato conectado

El portal administrativo consulta `GET /v1/admin/dashboard` con una sesión que tenga `admin.access`. La API devuelve únicamente indicadores calculados desde la base de datos; un usuario de empresa no puede consultar la ruta.

| Campo | Origen |
| --- | --- |
| `companies` | Total de empresas registradas. |
| `configuredCompanies` | Empresas que completaron el asistente de configuración. No representa suscripciones activas. |
| `documentsThisMonth` | Comprobantes con fecha de emisión en el mes actual de Santo Domingo, sin importar su estado DGII. |
| `trend` | Cantidad de comprobantes registrados por mes durante los últimos doce meses. |

Los indicadores de planes, pagos, solicitudes de API, incidencias y auditoría se retiraron de este resumen porque todavía no cuentan con datos de la API. Los demás módulos del portal administrativo siguen pendientes de integración y la pantalla lo indica. Si falla la consulta, se muestra el error y un botón para reintentar.

## Prueba manual propuesta

1. Entrar con el usuario SUPERADMIN en `/admin`. Confirmar que el número de empresas coincide con las empresas registradas en la base de datos y que el gráfico no muestra actividad inventada.
2. Registrar un comprobante de prueba desde una cuenta de empresa y volver al panel administrativo. «Comprobantes registrados» debe aumentar si la fecha de emisión corresponde al mes actual.
3. Entrar con un usuario normal de empresa: no debe poder abrir el panel administrativo ni consultar su API.

La prueba automática cubre agregación global, meses actual y anterior, separación de roles y acceso sin sesión. No envía comprobantes a la DGII.
