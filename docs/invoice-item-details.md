# Nombre y descripción de los ítems

En el formulario, «Nombre del artículo o servicio» representa `NombreItem` y admite un máximo de 80 caracteres. Su campo interno continúa siendo `description` y el adaptador lo envía como `descripcion` para conservar el contrato del portal.

«Descripción adicional» es opcional y se envía como `descripcionItem`. Los campos opcionales del viaje (`fechaServicio`, `chofer`, `tms`, `numeroSalida`, `placa`) se guardan separados. La fecha se envía como `yyyy-MM-dd` y se presenta como `dd/MM/yyyy`. La API compone la descripción que se usa en XML y PDF; el portal muestra la misma composición en el formulario, el resumen y la vista de impresión.

Ejemplo de ítem enviado al portal:

```json
{
  "descripcion": "Flete: Stgo. - San Cristóbal",
  "fechaServicio": "2026-10-29",
  "chofer": "Eliecer Bautista",
  "tms": "6883",
  "numeroSalida": "56642",
  "placa": "L123456",
  "indicadorBienServicio": "2",
  "cantidad": 1,
  "precioUnitario": 500,
  "descuento": 0,
  "tasaItbis": 18
}
```

La descripción resultante es `29/10/2026 | Chofer: Eliecer Bautista | TMS: 6883 | Salida: 56642 | Placa: L123456`. Si además hay texto explícito en `descripcionItem`, precede a los datos del viaje, separado por ` | `. Los segmentos ausentes se omiten.

El límite de 1000 caracteres se aplica tanto al texto explícito como al resultado completo con los datos del viaje. Los límites se validan al guardar borradores, validar y registrar. Los valores largos producen un error visible y se conservan para corregirlos; no se recortan. Los borradores incompletos pueden guardarse si su texto respeta estos límites.

Las facturas anteriores con solo `descripcion` continúan funcionando. Los campos adicionales vacíos se omiten del JSON. `descripcionItem` en las respuestas de detalle y de edición contiene el texto explícito; los metadatos se devuelven separados para evitar duplicarlos al editar.

Pruebas: `npm run test:invoice-items`, `npm run typecheck` y `npm run build`.
