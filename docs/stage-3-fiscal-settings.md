# Etapa 3: configuración fiscal y ambientes DGII por empresa

## Alcance conectado

- **Configuración > Empresa y Fiscal:** obtiene y guarda los datos de la empresa autenticada en la API. El RNC permanece asociado a esa empresa y no se puede cambiar desde esta pantalla.
- **Configuración inicial:** guarda cada paso en PostgreSQL. El asistente recupera el progreso, la provincia, las preferencias, el certificado y las secuencias al recargar o entrar desde otro dispositivo. Ya no usa datos simulados ni un borrador del navegador cuando hay conexión con la API.
- **Certificado:** el backend recibe archivos `.p12` o `.pfx` de hasta 5 MB, comprueba la contraseña, la clave privada y la vigencia antes de almacenarlos. El navegador no guarda la contraseña.
- **Secuencias:** los rangos se guardan con la lógica fiscal que ya tiene la API. No se permite eliminar una secuencia usada.
- **Centro DGII:** ambiente, certificado, secuencias, conteos y eventos actuales se leen de la empresa autenticada. La consulta por track ID usa una factura de esa empresa y consulta su estado en la DGII; un track ID de otra empresa no se consulta.
- **Ambiente por empresa:** la API selecciona las rutas de autenticación, recepción, consulta, directorio y QR según el ambiente **activo** de cada emisor. Las rutas se derivan de los servicios oficiales de la DGII; el ambiente inicial es TesteCF.
- **Ambiente de cada factura:** el ambiente se fija cuando se crea el comprobante. Sus consultas y QR siguen usando ese ambiente aunque la empresa cambie después.

Referencia de rutas: [Descripción técnica de servicios DGII](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Informe%20y%20Descripci%C3%B3n%20T%C3%A9cnica/Descripcion%20Tecnica%20Servicios%20DGII.pdf).

## Separación entre solicitud y activación

Elegir **Certificación** o **Producción** en el asistente registra el ambiente solicitado. **No activa** el envío a ese ambiente. La activación requiere una operación de la plataforma con rol de superadministrador, confirmación de habilitación DGII, certificado válido y secuencias vigentes. La pantalla muestra el ambiente activo, de modo que el usuario puede distinguirlo de lo solicitado.

La habilitación efectiva ante la DGII sigue siendo una comprobación humana externa. La API no puede inferirla del pago ni de la selección del usuario.

## Comprobación manual de esta etapa

1. Inicia sesión con el administrador de una empresa de prueba.
2. Abre **Configuración inicial**. Completa Empresa y Fiscal; luego solicita **Producción** como prueba. En **Configuración > Ambiente DGII** debe seguir apareciendo **Pruebas (TesteCF)** como ambiente activo.
3. Continúa sin certificado ni secuencias si aún no los tienes. Al finalizar debe quedar claro que la emisión sigue pendiente. Recarga la página y confirma que el asistente conserva los datos y el progreso.
4. Cambia teléfono, dirección o actividad en **Configuración**. Recarga y confirma que los valores vienen de la API.
5. En **Centro DGII**, confirma que el certificado y las secuencias aparecen como pendientes si aún no se han registrado. Un track ID inexistente debe dar error; no debe mostrar una respuesta ficticia.
6. Si tienes un certificado de prueba válido, súbelo y confirma que aparecen sus datos reales. Puedes registrar una secuencia de prueba autorizada para tu RNC y verificarla en Configuración. No es necesario enviar comprobantes reales para probar esta etapa.

## Validación automática y límites

- La migración V3 se aplicó en la base de desarrollo y las pruebas de la API pasan, incluida una prueba de HTTP con autenticación, persistencia y separación entre ambiente solicitado y activo.
- La compilación del frontend pasa.
- La emisión visual de facturas y su PDF no se modificaron. El módulo de facturas y otros módulos todavía usan datos de demostración; se conectarán en etapas posteriores.
- No se ha probado una llamada real a la DGII con las credenciales y certificados del usuario. La consulta por track ID requiere un envío real previamente registrado.
