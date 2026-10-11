# Etapa 14 — logo de empresa en comprobantes

En **Configuración → Datos de empresa** se puede seleccionar una imagen PNG, JPG o GIF de hasta 5 MB, verla antes de enviarla, guardarla y sustituirla. El logo se almacena en la API para la empresa autenticada; la vista previa guardada se obtiene por una ruta autenticada. La respuesta de datos de empresa indica si hay un logo. El RNC usado para cargar y leer el archivo proviene de la sesión, no del navegador.

El generador de PDF incorpora el PNG almacenado como imagen embebida en la plantilla actual. No se cambió el diseño del comprobante. Si todavía no hay logo, se mantiene el nombre de la empresa que ya mostraba la plantilla.

## Prueba manual

1. Entra como administrador de una empresa y abre **Configuración → Datos de empresa**.
2. Selecciona un PNG, JPG o GIF. Comprueba la vista previa y pulsa **Agregar logo** o **Cambiar logo**. La imagen debe seguir visible tras recargar la página.
3. Abre el PDF de un comprobante existente de esa empresa: debe mostrar el logo en la parte superior. No hace falta emitir ni enviar un nuevo comprobante a la DGII.
4. Sube una imagen distinta y vuelve a abrir el PDF. Debe aparecer el logo nuevo.
5. Prueba un archivo que no sea imagen o supere 5 MB: debe rechazarse.

Las pruebas automáticas cubren la carga, lectura autenticada, reemplazo y presencia de la imagen dentro del PDF. Los archivos de prueba se retiran después de ejecutarlas.
