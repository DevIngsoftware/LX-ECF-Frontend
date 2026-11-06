# Datos opcionales del encabezado

Los datos del emisor se editan en Configuración → Datos de empresa y en el primer paso de configuración inicial. Se guardan en la empresa y la API los reutiliza automáticamente al generar facturas:

- `sucursal`: opcional, hasta 20 caracteres.
- `email`: correo de facturación opcional (`CorreoEmisor`), con formato compatible con DGII y hasta 80 caracteres.
- `webSite`: opcional, hasta 50 caracteres.

El correo de acceso del usuario es independiente. Dejar vacío el correo de facturación permite guardar la configuración y continuar la configuración inicial.

En cada comprobante se pueden capturar `conductor` (hasta 20 caracteres) y `placa` (hasta 7 caracteres) como propiedades del nivel principal del contrato del portal. Ambos campos son opcionales e independientes; se omiten del JSON cuando están vacíos. También se conservan al guardar y reabrir borradores o editar una factura, y se muestran en el resumen y la vista de impresión cuando tienen contenido.

Los tipos que admiten estos datos de transporte son E31, E32, E33, E34, E44, E45 y E46. En E41, E43 y E47, el formulario no muestra esos campos. Cambiar a un tipo que no los admite retira sus valores con un aviso visible. La validación del formulario y de borradores rechaza valores de transporte que lleguen para un tipo no compatible.

Estos campos del encabezado son independientes de `chofer` y `placa` de cada línea de flete, que continúan formando parte de `DescripcionItem`. La captura del encabezado no modifica el nombre o la descripción de las líneas.

Todos los límites se validan antes de limpiar espacios y producen mensajes de error sin truncar datos. Pruebas: `npm run test:invoice-items`, `npm run typecheck` y `npm run build`.
