import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Reutiliza el compilador y los alias de la aplicación sin añadir un runner.
const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
try {
  const { itemSchema, itemTextSchema, invoiceFormSchema, invoiceTransportSchema, defaultValues, fromDraft, toDraft } = await server.ssrLoadModule('/src/features/invoices/components/new/schema.ts');
  const { buildItemDescription } = await server.ssrLoadModule('/src/features/invoices/lib/item-description.ts');
  const { toFacturaRequestDTO, fromFacturaRequestDTO } = await server.ssrLoadModule('/src/services/adapters/invoice.adapter.ts');
  const { ItemsTable } = await server.ssrLoadModule('/src/features/invoices/components/ItemsTable.tsx');
  const { InvoiceTransportDetails } = await server.ssrLoadModule('/src/features/invoices/components/InvoiceTransportDetails.tsx');
  const { companySchema, defaultsFromCompany } = await server.ssrLoadModule('/src/features/onboarding/schemas.ts');
  const { emitterFields } = await server.ssrLoadModule('/src/lib/emitter-fields.ts');
  const { ECF_TYPE_MAP, PAYMENT_TYPES, supportsInvoiceTransport } = await server.ssrLoadModule('/src/constants/ecf.ts');

  const item = { description: 'Flete: Stgo. - San Cristóbal', kind: 'SERVICIO', quantity: 1, unitPrice: 500, discount: 0, itbisRate: 18 };
  const freight = { fechaServicio: '2026-10-29', chofer: 'Eliecer Bautista', tms: '6883', numeroSalida: '56642', placa: 'L123456' };

  const noteValues = (type, paymentType) => ({
    ...defaultValues(type),
    buyer: { rnc: '101000000', name: 'Cliente de prueba', email: '', foreignId: '', country: '' },
    paymentType,
    paymentTermDays: paymentType === '2' ? 30 : undefined,
    items: [item],
    reference: { modifiedNcf: 'E310000000001', modifiedDate: '2026-10-29', modificationCode: '3', reason: 'Ajuste del importe' },
  });

  await test('E33 y E34 permiten Contado, Crédito y Gratuito y conservan el tipo al guardar y editar', () => {
    for (const type of ['E33', 'E34']) {
      const options = PAYMENT_TYPES.filter((option) => option.value !== '2' || ECF_TYPE_MAP[type].allowsCredit);
      assert.deepEqual(options.map((option) => option.value), ['1', '2', '3']);
      for (const paymentType of ['1', '2', '3']) {
        const values = invoiceFormSchema.parse(noteValues(type, paymentType));
        const payload = toFacturaRequestDTO(toDraft(values));
        assert.equal(payload.tipoPago, paymentType);
        assert.equal(payload.plazoPagoDias, paymentType === '2' ? 30 : undefined);
        const restored = fromDraft(fromFacturaRequestDTO(payload));
        assert.equal(restored.paymentType, paymentType);
        assert.equal(restored.paymentTermDays, values.paymentTermDays);
        assert.equal(invoiceFormSchema.safeParse(restored).success, true);
      }
    }
  });

  await test('las notas rechazan tipos de pago ajenos al catálogo XSD', () => {
    for (const type of ['E33', 'E34']) {
      for (const paymentType of ['', '0', '4', '01', 'CONTADO']) {
        const result = invoiceFormSchema.safeParse(noteValues(type, paymentType));
        assert.equal(result.success, false);
        assert.equal(result.error.issues.some((issue) => issue.path[0] === 'paymentType'), true);
      }
    }
  });

  await test('el pago a crédito en E33 y E34 requiere un plazo entero entre 1 y 365 días', () => {
    for (const type of ['E33', 'E34']) {
      for (const paymentTermDays of [1, 365]) {
        assert.equal(invoiceFormSchema.safeParse({ ...noteValues(type, '2'), paymentTermDays }).success, true);
      }
      for (const paymentTermDays of [undefined, 0, 366, 1.5]) {
        const result = invoiceFormSchema.safeParse({ ...noteValues(type, '2'), paymentTermDays });
        assert.equal(result.success, false);
        assert.equal(result.error.issues.some((issue) => issue.path[0] === 'paymentTermDays'), true);
      }
    }
  });

  await test('NombreItem acepta 80 caracteres y rechaza 81 sin recortarlos', () => {
    assert.equal(itemSchema.parse({ ...item, description: 'x'.repeat(80) }).description.length, 80);
    const result = itemSchema.safeParse({ ...item, description: 'x'.repeat(81) });
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /80.*Reduce el nombre.*DescripcionItem/);
    assert.equal(itemSchema.safeParse({ ...item, description: ` ${'x'.repeat(80)}` }).success, false);
    assert.equal(itemSchema.safeParse({ ...item, description: '   ' }).success, false);
  });

  await test('DescripcionItem permite 1000 caracteres y rechaza 1001', () => {
    assert.equal(itemSchema.safeParse({ ...item, descripcionItem: 'x'.repeat(1000) }).success, true);
    assert.equal(itemSchema.safeParse({ ...item, descripcionItem: 'x'.repeat(1001) }).success, false);
  });

  await test('valida el límite de 1000 incluyendo los datos generados del viaje', () => {
    assert.equal(itemSchema.safeParse({ ...item, descripcionItem: 'x'.repeat(988), tms: '6883' }).success, true);
    const result = itemSchema.safeParse({ ...item, descripcionItem: 'x'.repeat(990), tms: '6883' });
    assert.equal(result.success, false);
    assert.deepEqual(result.error.issues[0].path, ['descripcionItem']);
    assert.match(result.error.issues[0].message, /incluidos los datos del viaje/);
    assert.equal(itemSchema.safeParse({ ...item, chofer: 'x'.repeat(1000) }).success, false);
  });

  await test('concatena todos los datos del viaje con el formato esperado', () => {
    assert.equal(buildItemDescription(freight), '29/10/2026 | Chofer: Eliecer Bautista | TMS: 6883 | Salida: 56642 | Placa: L123456');
    assert.equal(buildItemDescription({ ...freight, placa: undefined }), '29/10/2026 | Chofer: Eliecer Bautista | TMS: 6883 | Salida: 56642');
    assert.equal(buildItemDescription({ fechaServicio: '2026-10-29', tms: '6883' }), '29/10/2026 | TMS: 6883');
  });

  await test('omite segmentos nulos, vacíos y espacios sin separadores sobrantes', () => {
    assert.equal(buildItemDescription({ descripcionItem: null, chofer: '', placa: '  ', tms: ' 6883 ' }), 'TMS: 6883');
    assert.equal(buildItemDescription({ descripcionItem: '', fechaServicio: null }), '');
    assert.equal(buildItemDescription({ ...freight, descripcionItem: ' Viaje urgente ' }), 'Viaje urgente | 29/10/2026 | Chofer: Eliecer Bautista | TMS: 6883 | Salida: 56642 | Placa: L123456');
  });

  await test('la fecha conserva el día local y rechaza fechas de calendario inválidas', () => {
    assert.equal(buildItemDescription({ fechaServicio: '2026-10-29' }), '29/10/2026');
    assert.equal(itemSchema.safeParse({ ...item, fechaServicio: '2026-02-30' }).success, false);
    assert.equal(itemSchema.safeParse({ ...item, fechaServicio: '29/10/2026' }).success, false);
  });

  await test('los borradores incompletos conservan la validación de texto', () => {
    assert.equal(itemTextSchema.safeParse({ description: '' }).success, true);
    assert.equal(itemTextSchema.safeParse({ description: 'x'.repeat(81) }).success, false);
    assert.equal(itemTextSchema.safeParse({ description: '', descripcionItem: 'x'.repeat(999), tms: '6883' }).success, false);
  });

  await test('el adaptador conserva nombre, descripción y metadatos separados al guardar y editar', () => {
    const values = defaultValues('E32');
    values.items = [{ ...item, ...freight, descripcionItem: 'Viaje urgente' }];
    const payload = toFacturaRequestDTO(toDraft(values));
    assert.equal(payload.items[0].descripcion, item.description);
    assert.equal(payload.items[0].descripcionItem, 'Viaje urgente');
    assert.equal(payload.items[0].fechaServicio, '2026-10-29');
    assert.equal(payload.items[0].tms, '6883');
    const restored = fromDraft(fromFacturaRequestDTO(payload));
    assert.equal(restored.items[0].description, item.description);
    assert.equal(restored.items[0].descripcionItem, 'Viaje urgente');
    assert.equal(buildItemDescription(restored.items[0]), buildItemDescription(values.items[0]));
  });

  await test('las facturas anteriores solo con NombreItem siguen siendo compatibles', () => {
    assert.equal(itemSchema.safeParse(item).success, true);
    const values = defaultValues('E32');
    values.items = [item];
    const payload = toFacturaRequestDTO(toDraft(values));
    const jsonItem = JSON.parse(JSON.stringify(payload)).items[0];
    assert.equal('descripcionItem' in jsonItem, false);
    assert.equal('fechaServicio' in jsonItem, false);
    assert.equal(fromFacturaRequestDTO(payload).items[0].description, item.description);
    assert.equal(buildItemDescription(fromFacturaRequestDTO(payload).items[0]), '');
    values.items = [{ ...item, descripcionItem: '  ' }];
    assert.equal('descripcionItem' in JSON.parse(JSON.stringify(toFacturaRequestDTO(toDraft(values)))).items[0], false);
  });

  await test('detalle y vista de impresión muestran el nombre y la descripción adicional', () => {
    const html = renderToStaticMarkup(createElement(ItemsTable, { items: [{ ...item, ...freight, descripcionItem: 'Viaje urgente' }], print: true }));
    assert.match(html, /Flete: Stgo\. - San Cristóbal/);
    assert.match(html, /Viaje urgente \| 29\/10\/2026 \| Chofer: Eliecer Bautista \| TMS: 6883 \| Salida: 56642 \| Placa: L123456/);
    assert.equal(html.split('TMS: 6883').length - 1, 1);
  });

  await test('Conductor acepta 20 caracteres y Placa 7, y rechaza excesos antes de limpiar espacios', () => {
    assert.equal(invoiceTransportSchema.safeParse({ type: 'E32', conductor: 'x'.repeat(20), placa: 'L123456' }).success, true);
    const driver = invoiceTransportSchema.safeParse({ type: 'E32', conductor: 'x'.repeat(21) });
    assert.equal(driver.success, false);
    assert.match(driver.error.issues[0].message, /20 caracteres/);
    const plate = invoiceTransportSchema.safeParse({ type: 'E32', placa: 'L1234567' });
    assert.equal(plate.success, false);
    assert.match(plate.error.issues[0].message, /7 caracteres/);
    assert.equal(invoiceTransportSchema.safeParse({ type: 'E32', conductor: ` ${'x'.repeat(20)}` }).success, false);
    assert.equal(invoiceTransportSchema.safeParse({ type: 'E32', placa: ' L123456' }).success, false);
  });

  await test('el transporte es opcional y acepta conductor o placa por separado', () => {
    for (const fields of [{}, { conductor: null, placa: null }, { conductor: '   ', placa: '' }, { conductor: 'Eliecer Bautista' }, { placa: 'L123456' }]) {
      assert.equal(invoiceTransportSchema.safeParse({ type: 'E32', ...fields }).success, true);
    }
  });

  await test('valida los tipos compatibles y rechaza transporte de cabecera en E41, E43 y E47', () => {
    for (const type of ['E31', 'E32', 'E33', 'E34', 'E44', 'E45', 'E46']) {
      assert.equal(supportsInvoiceTransport(type), true);
      assert.equal(invoiceTransportSchema.safeParse({ type, conductor: 'Eliecer Bautista', placa: 'L123456' }).success, true);
    }
    for (const type of ['E41', 'E43', 'E47']) {
      assert.equal(supportsInvoiceTransport(type), false);
      assert.equal(invoiceTransportSchema.safeParse({ type }).success, true);
      const result = invoiceTransportSchema.safeParse({ type, conductor: 'Eliecer Bautista', placa: 'L123456' });
      assert.equal(result.success, false);
      assert.deepEqual(result.error.issues.map((issue) => issue.path), [['conductor'], ['placa']]);
      assert.match(result.error.issues[0].message, /no admite/);
    }
    const unsupported = { ...defaultValues('E43'), conductor: 'Eliecer Bautista', items: [item] };
    const result = invoiceFormSchema.safeParse(unsupported);
    assert.equal(result.success, false);
    assert.equal(result.error.issues.some((issue) => issue.path[0] === 'conductor'), true);
  });

  await test('transporte de cabecera guarda y restaura sin alterar chofer o placa de las líneas', () => {
    const values = { ...defaultValues('E32'), conductor: 'Eliecer Bautista', placa: 'L765432', items: [{ ...item, ...freight }] };
    assert.equal(invoiceFormSchema.safeParse(values).success, true);
    const payload = toFacturaRequestDTO(toDraft(values));
    assert.equal(payload.conductor, 'Eliecer Bautista');
    assert.equal(payload.placa, 'L765432');
    assert.equal(payload.items[0].placa, 'L123456');
    const restored = fromDraft(fromFacturaRequestDTO(payload));
    assert.equal(restored.conductor, values.conductor);
    assert.equal(restored.placa, values.placa);
    assert.equal(restored.items[0].placa, values.items[0].placa);
    assert.equal(buildItemDescription(restored.items[0]), buildItemDescription(values.items[0]));
  });

  await test('los campos de transporte vacíos se omiten y las facturas anteriores se restauran', () => {
    const values = { ...defaultValues('E32'), conductor: '  ', placa: '', items: [item] };
    const payload = JSON.parse(JSON.stringify(toFacturaRequestDTO(toDraft(values))));
    assert.equal('conductor' in payload, false);
    assert.equal('placa' in payload, false);
    const restored = fromDraft(fromFacturaRequestDTO(payload));
    assert.equal(restored.conductor, '');
    assert.equal(restored.placa, '');
  });

  await test('detalle e impresión muestran solo los datos de transporte presentes y admitidos', () => {
    const html = renderToStaticMarkup(createElement(InvoiceTransportDetails, { type: 'E32', conductor: 'Eliecer Bautista', placa: 'L123456' }));
    assert.match(html, /Conductor:/);
    assert.match(html, /Eliecer Bautista/);
    assert.match(html, /Placa:/);
    assert.match(html, /L123456/);
    const onlyDriver = renderToStaticMarkup(createElement(InvoiceTransportDetails, { type: 'E31', conductor: 'Eliecer Bautista' }));
    assert.doesNotMatch(onlyDriver, /Placa:/);
    assert.equal(renderToStaticMarkup(createElement(InvoiceTransportDetails, { type: 'E32', conductor: '  ', placa: '' })), '');
    assert.equal(renderToStaticMarkup(createElement(InvoiceTransportDetails, { type: 'E43', conductor: 'Eliecer Bautista' })), '');
  });

  await test('Sucursal y WebSite aceptan sus límites y rechazan excesos sin recortar', () => {
    assert.equal(emitterFields.sucursal.parse('x'.repeat(20)).length, 20);
    assert.equal(emitterFields.sucursal.safeParse('x'.repeat(21)).success, false);
    assert.equal(emitterFields.sucursal.safeParse(` ${'x'.repeat(20)}`).success, false);
    assert.equal(emitterFields.webSite.parse('x'.repeat(50)).length, 50);
    assert.equal(emitterFields.webSite.safeParse('x'.repeat(51)).success, false);
    assert.equal(emitterFields.webSite.safeParse(` ${'x'.repeat(50)}`).success, false);
    assert.equal(emitterFields.sucursal.parse(null), '');
    assert.equal(emitterFields.webSite.parse(undefined), '');
  });

  await test('CorreoEmisor es opcional y valida formato y máximo 80 antes de limpiar espacios', () => {
    assert.equal(emitterFields.email.parse(undefined), '');
    assert.equal(emitterFields.email.parse(null), '');
    assert.equal(emitterFields.email.parse('  '), '');
    assert.equal(emitterFields.email.parse(' facturacion@example.com '), 'facturacion@example.com');
    assert.equal(emitterFields.email.parse(`${'a'.repeat(64)}@example.test.io`).length, 80);
    assert.equal(emitterFields.email.safeParse(`${'a'.repeat(64)}@examplex.test.io`).success, false);
    assert.equal(emitterFields.email.safeParse(` ${'a'.repeat(64)}@example.test.io`).success, false);
    assert.equal(emitterFields.email.safeParse('correo-invalido').success, false);
    assert.equal(emitterFields.email.safeParse('correo..invalido@example.com').success, false);
  });

  await test('CorreoEmisor limita la parte local y las etiquetas del dominio conforme al modelo', () => {
    assert.equal(emitterFields.email.safeParse(`${'a'.repeat(64)}@e.co`).success, true);
    assert.equal(emitterFields.email.safeParse(`${'a'.repeat(65)}@e.co`).success, false);
    assert.equal(emitterFields.email.safeParse(`a@${'b'.repeat(63)}.co`).success, true);
    assert.equal(emitterFields.email.safeParse(`a@${'b'.repeat(64)}.co`).success, false);
    assert.equal(emitterFields.email.safeParse('a@-example.com').success, false);
    assert.equal(emitterFields.email.safeParse('a@example-.com').success, false);
    assert.equal(emitterFields.email.safeParse('a@example.-com').success, false);
    assert.equal(emitterFields.email.safeParse('a@example.com-').success, false);
    assert.equal(emitterFields.email.safeParse('a+facturas@mi-empresa.com').success, true);
  });

  await test('onboarding conserva datos del emisor y permite guardar sin correo de facturación', () => {
    const company = { legalName: 'Load Express SRL', tradeName: '', phone: '', address: 'Santiago, República Dominicana' };
    const legacy = companySchema.parse(company);
    assert.equal(legacy.email, '');
    assert.equal(legacy.sucursal, '');
    assert.equal(legacy.webSite, '');
    const parsed = companySchema.parse({ ...company, sucursal: 'Santiago', webSite: 'https://loadexpress.com', email: '' });
    assert.equal(parsed.sucursal, 'Santiago');
    assert.equal(parsed.webSite, 'https://loadexpress.com');
    const restored = defaultsFromCompany({ ...parsed, rnc: '101000000', defaultItbisRate: 18, defaultPaymentTermDays: 30, sendEmailToBuyer: true, logoPresent: false });
    assert.equal(restored.company.sucursal, parsed.sucursal);
    assert.equal(restored.company.webSite, parsed.webSite);
    assert.equal(restored.company.email, '');
    assert.equal(companySchema.safeParse({ ...company, sucursal: 'x'.repeat(21) }).success, false);
    assert.equal(companySchema.safeParse({ ...company, webSite: 'x'.repeat(51) }).success, false);
  });
} finally {
  await server.close();
}
