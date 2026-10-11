# LX e-CF: contrato de integración, etapa 1

Estado: diagnóstico y contrato propuesto a partir del código local. Este documento no implementa endpoints ni cambia la emisión fiscal. El frontend es la referencia de los flujos de producto; la API existente es la referencia de cálculo, firma, envío a DGII y representación de la factura.

**Regla aprobada tras la revisión del usuario:** cuando un formulario, nombre de campo, respuesta o flujo de producto difiera, la API nueva se adapta al contrato del frontend. El registro del frontend, por ejemplo, no debe exigir campos adicionales solo porque el DTO antiguo del backend los exigía: esos datos se completarán en el onboarding o se resolverán en la API. La conversión hacia DTOs fiscales actuales será interna y explícita; no se trasladará al frontend la estructura interna de Spring Boot. Solo se preservan como fuente de verdad las reglas fiscales, la firma, el envío y la presentación actual de la factura.

## Acuerdos de alcance

- Integrar **API, base de datos y frontend** por módulo. Al terminar un módulo, eliminar su fuente de datos simulados y mostrar estados reales de carga, vacío y error. Una URL de API ausente en un despliegue integrado debe dar un error de configuración, no activar datos de demostración silenciosamente.
- Mantener el HTML de la factura y el flujo actual que produce su PDF. Antes de modificar código cercano a la emisión, fijar un caso representativo para comparar XML y PDF.
- El usuario probará cada etapa y subirá personalmente los cambios aprobados a GitHub. No avanzar a la siguiente etapa antes de su revisión.
- La base actual contiene solo datos de prueba. Los cambios de esquema serán migraciones versionadas; el recreado automático queda limitado, si se necesita, a un perfil local descartable.
- El pago inicial será una operación **SIMULADA** persistida en la API y visible como tal. La integración real con Azul queda para después.

## Estado de los dos repositorios

El frontend separa acceso de empresa y administración interna, y declara servicios HTTP para todos sus módulos. Hoy selecciona servicios simulados cuando `VITE_USE_MOCKS=true` **o** no está definida `VITE_API_BASE_URL`. Las rutas de `src/services/api/endpoints.ts` y el adaptador de factura se declaran provisionales. La documentación para desarrolladores también muestra rutas y respuestas ilustrativas.

La API Spring Boot expone rutas bajo `/v1` para autenticación, facturas, clientes, emisor, secuencias, recepción fiscal, certificación y consulta RNC. Su autorización general diferencia `USER` y `ADMIN`; no ofrece todavía la matriz de roles y permisos de los dos portales. La configuración de destinos DGII se toma de propiedades globales. El esquema PostgreSQL tiene `spring.jpa.hibernate.ddl-auto=none` y no se encontró un directorio de migraciones ni pruebas automatizadas en `src/test`.

### Matriz de módulos

| Flujo del frontend | Base disponible en la API | Brecha para conexión real |
| --- | --- | --- |
| Registro e inicio de sesión | `POST /v1/auth/register`, `POST /v1/auth/login` | Adaptar solicitud y respuesta de la API a los formularios; faltan sesión actual, recuperación, verificación y cierre de sesión según las pantallas. |
| Usuarios y roles de empresa | `Usuario` ligado a `Emisor`; seguridad `USER`/`ADMIN` | CRUD, invitaciones, cuatro roles de empresa y comprobación de permisos en cada operación. |
| Portal interno LX | No hay controladores equivalentes | Cuentas y roles internos separados, empresas, planes, suscripciones, soporte, auditoría y configuración. |
| Alta y configuración fiscal | `Emisor`, carga de certificado y secuencias | Estado de onboarding, preferencias, ambiente DGII por empresa y cálculo de `canIssue` desde el servidor. |
| Comprobantes y Centro DGII | Crear, procesar, listar, generar XML, enviar, consultar estado/seguimiento y descargar PDF | Exponer DTOs del producto compatibles con el frontend y mapearlos internamente al motor fiscal; añadir detalle, borrador, validación previa, descarga XML, paginación/filtros y resumen DGII. |
| Clientes, proveedores y consulta RNC | CRUD de clientes y `GET /v1/rnc/{rnc}` | Adaptación de DTOs, estado activo, historial y módulo de proveedores. |
| Catálogo, cuentas por cobrar, gastos y reportes | No hay servicios equivalentes | Persistencia, reglas, consultas, exportaciones y límites por plan. |
| Recepción | Rutas para recibir XML fiscal y entidades de recepción | Lista para el portal, detalle, estado y descarga del XML recibido. |
| Tablero y notificaciones | Datos fiscales básicos para agregación | Resúmenes, alertas y notificaciones persistidas por empresa. |
| Suscripciones, planes y módulos | No hay servicios equivalentes | Planes, límites, asignaciones, cambios de plan y pago simulado. |
| Credenciales de desarrolladores | No hay intercambio de clave/secreto ni gestión de claves | Credenciales por empresa y ambiente, token técnico, revocación, uso y auditoría. |

## Desajustes de contrato que impiden conectar directamente

### Autenticación humana

El formulario envía `identifier`, `password`, `remember` y espera `{ user, tokens }`. La API recibe `username`, `password` y devuelve un cuerpo con `rnc`, `username`, `token`, `rol`, `img`. El registro del frontend envía `companyName`, `rnc`, `ownerName`, `email`, `password`; la API espera `rncEmisor`, `razonSocialEmisor`, `direccionEmisor`, `username`, `password`, `correo`, `telefonos`. La ruta de registro **sí está permitida públicamente por la configuración de seguridad**, aunque su descripción Swagger afirma lo contrario. La API debe aceptar el formulario del frontend y devolver el formato de sesión que este espera; la dirección y otros datos fiscales se completarán después durante el onboarding. También debe corregirse la documentación de la ruta.

La sesión humana debe devolver identidad, portal, rol, permisos, módulos y empresa. Los permisos del frontend no bastan para autorizar: la API debe aplicarlos. Las credenciales técnicas de desarrolladores se administran desde una sesión humana con permiso, pero se usan solo desde servidores de integración; no se envían al navegador.

### Emisión y consulta de comprobantes

> Estado: esta sección documenta la brecha inicial. La implementación y sus límites de la etapa 4 están en [stage-4-invoices.md](stage-4-invoices.md).

`toFacturaRequestDTO()` no coincide con `FacturaRequestDTO` e `ItemDTO` reales. Al implementar la emisión, la API expondrá un DTO de entrada compatible con el formulario del frontend y lo convertirá internamente al DTO fiscal existente:

| Dato | Frontend actual | API actual | Adaptación necesaria |
| --- | --- | --- | --- |
| Tipo e-CF | `"E31"` y otros códigos `E..` | `BigInteger tipoEcf`, por ejemplo `31` | Conversión explícita y validación de tipos admitidos. |
| Forma de pago | Cadena | `BigInteger tipoPago` | Convertir los códigos sin inferirlos por etiqueta. |
| Ítem | `descripcion`, `indicadorBienServicio`, `tasaItbis`, `cantidad`, `precioUnitario`, `descuento` | `nombreItem`, `indicadorBienoServicio`, `indicadorFacturacion`, `numeroLinea`, `montoItem` y otros | Mapear código, tasa, monto y orden de línea conforme a la lógica fiscal existente. |
| Comprador | Nombre/RNC/correo en el borrador | Creación usa `rncComprador` y exige cliente del mismo emisor si está indicado | Resolver o registrar el cliente antes de procesar, sin usar uno de otra empresa. |
| Respuesta | `id`, `encf`, estados, mensajes, detalle | `FacturaResponseDTO` con `encf`, montos, estados, track y mensaje | Adaptar la respuesta y fijar si el identificador público será e-NCF. |
| Lista | Objeto paginado y filtrable | Lista simple de `FacturaResponseDTO` | Paginación/filtros en API o adaptador documentado. |

El botón de emisión del frontend invoca hoy `POST /facturas` y envía `Idempotency-Key`; la API ya ofrece `POST /v1/facturas/procesar` para crear, firmar, enviar y consultar, pero no consume ese encabezado. El contrato de emisión debe evitar duplicados si hay reintentos o pérdida de respuesta. El detalle del frontend se dirige a `GET /facturas/{id}`, mientras la API ofrece seguimiento por `{encf}`. La descarga PDF ya existe en `GET /v1/facturas/{encf}/pdf`; el frontend debe usarla sin regenerar la factura. La descarga XML que espera el frontend aún no tiene un `GET` equivalente.

La consulta del Centro DGII busca por track ID. La API localiza primero la factura del emisor por e-NCF y usa el track ID guardado para consultar a DGII. Se propone que e-NCF sea la referencia de factura del portal; una búsqueda adicional por track ID deberá localizar **solo** facturas de la empresa autenticada.

### Ambientes DGII

El frontend modela pruebas, certificación y producción para cada empresa. En la API, las URLs DGII se leen de `application.properties` para todos los emisores. Se propone persistir el ambiente por empresa y resolver URLs/credenciales/certificado y secuencias desde esa empresa en cada operación. El portal no puede habilitar producción por sí solo; esa transición requiere una decisión autorizada y verificación del estado fiscal.

## Convenciones propuestas para la implementación

1. Publicar un único prefijo de API `/v1` y configurar la URL base del frontend para evitar rutas duplicadas o sin prefijo. Los campos y respuestas de producto siguen el contrato del frontend; la ruta técnica puede normalizarse sin cambiar la experiencia. Actualizar la documentación de desarrolladores con rutas reales, no ejemplos provisionales.
2. Documentar para cada endpoint solicitud, respuesta, errores, paginación, rol/permiso, empresa y ambiente. Generar o mantener una especificación OpenAPI y probar el contrato desde ambos proyectos.
3. Distinguir autenticación humana de técnica. La clave y secreto técnicos obtienen un token corto con empresa, ambiente y alcance; el secreto se muestra una vez y se guarda de forma no reversible. Los tokens de portal y de integración no se confunden.
4. Aplicar aislamiento por empresa en consultas, escrituras, archivos, credenciales y reportes. Los roles internos LX no obtienen acceso fiscal a una empresa por el simple hecho de ser administradores de plataforma.
5. Mantener separados estado de suscripción, pago simulado, módulos contratados y habilitación fiscal (`canIssue`).
6. Retirar mocks por módulo al cerrar sus pruebas. En producción, un error de API permanece visible como error; nunca se reemplaza con datos de ejemplo.

## Referencia de factura que debe conservarse

- Plantilla: `ecf-api/src/main/resources/templates/factura.html`; SHA-256 actual: `7cd4d3c710fcf6b93276a6270d801e6794e7f2f8280c3e4201bfb31351b48d5d`.
- Renderizador: `ecf-api/src/main/java/com/loadexpress/api/ecf_api/service/PdfService.java`; SHA-256 actual: `5d1c82753edafc0b5e2fc38740831432b917fa310c1897816374cb6f87598001`.
- Entrada actual: `GET /v1/facturas/{encf}/pdf` llama a `FacturaService.VerPDF`, que exporta la plantilla `factura`.
- Estos hashes fijan el punto de partida del código, **no** prueban que dos PDFs sean visualmente iguales. Antes de integrar facturas debe guardarse un ejemplo representativo y compararse la salida PDF/XML con la nueva versión.

## Estado de Git al iniciar

Los repositorios de frontend y API están separados. El frontend estaba limpio antes de añadir este documento. La API ya tenía cambios locales sin confirmar en `pom.xml`, `SpringSecurityConfig.java` y `application.properties`; corresponden a nombre de compilación, ajustes de rutas/estilo de seguridad y direcciones DGII. Esta etapa no modifica esos archivos ni los incorpora a un commit. No se hará push a GitHub desde este trabajo.

## Salida de esta etapa y siguiente punto de control

Esta etapa entrega la matriz de brechas, las incompatibilidades de contrato prioritarias y la referencia del PDF actual. La siguiente etapa, tras revisión del usuario, debe comenzar por migraciones, sesión humana, empresas, roles y aislamiento; cada módulo conectado sustituirá sus mocks y tendrá pruebas de extremo a extremo antes de entregarse para revisión.

## Verificación realizada

- `npm run build` del frontend: correcto.
- `mvn -q -DskipTests compile` de la API: correcto.
- No había pruebas automatizadas bajo `src/test` en la API. No se generó un PDF de muestra en esta etapa; los hashes anteriores son una referencia del código, no una comparación visual. Antes de integrar la emisión habrá que fijar una factura de prueba reproducible y comparar su PDF/XML.
