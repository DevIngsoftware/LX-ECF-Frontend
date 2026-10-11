import { z } from 'zod';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import type { EcfTypeCode, InvoiceDraft } from '@/types/ecf';
import { computeTotals } from '../../lib/invoice-math';

const ECF_CODES = ['E31', 'E32', 'E33', 'E34', 'E41', 'E43', 'E44', 'E45', 'E46', 'E47'] as const satisfies readonly EcfTypeCode[];

const num = (msg = 'Ingresa un número válido') => z.number({ invalid_type_error: msg, required_error: msg });

export const itemSchema = z.object({
  code: z.string().optional(),
  description: z.string().trim().min(1, 'Describe el artículo').max(500, 'Máximo 500 caracteres'),
  kind: z.enum(['BIEN', 'SERVICIO']),
  quantity: num().positive('Debe ser mayor que 0'),
  unitPrice: num().min(0, 'No puede ser negativo'),
  discount: num().min(0, 'No puede ser negativo'),
  itbisRate: num(),
});

export const invoiceFormSchema = z
  .object({
    type: z.enum(ECF_CODES),
    buyer: z.object({
      partyId: z.string().optional(),
      rnc: z.string().trim(),
      name: z.string().trim().max(150, 'Máximo 150 caracteres'),
      email: z.string().trim(),
      foreignId: z.string().trim(),
      country: z.string().trim(),
    }),
    incomeType: z.string().min(1, 'Selecciona el tipo de ingreso'),
    paymentType: z.string().min(1, 'Selecciona la forma de pago'),
    paymentTermDays: num('Ingresa los días de plazo').int('Debe ser un número entero').optional(),
    items: z.array(itemSchema).min(1, 'Agrega al menos un artículo'),
    retentions: z.object({ itbis: num().min(0, 'No puede ser negativo'), isr: num().min(0, 'No puede ser negativo') }),
    reference: z.object({
      modifiedNcf: z.string().trim(),
      modifiedDate: z.string(),
      modificationCode: z.string(),
      reason: z.string().trim().max(250, 'Máximo 250 caracteres'),
    }),
    notes: z.string().max(500, 'Máximo 500 caracteres'),
  })
  .superRefine((v, ctx) => {
    const cfg = ECF_TYPE_MAP[v.type];
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const rnc = v.buyer.rnc.replace(/[\s-]/g, '');
    const rncValid = /^(\d{9}|\d{11})$/.test(rnc);

    if (cfg.buyerMode === 'required_rnc' || cfg.buyerMode === 'supplier') {
      if (!rnc) issue(['buyer', 'rnc'], cfg.buyerMode === 'supplier' ? 'La cédula o RNC del proveedor es obligatoria' : 'El RNC o cédula es obligatorio para este tipo');
      else if (!rncValid) issue(['buyer', 'rnc'], 'Debe tener 9 dígitos (RNC) u 11 dígitos (cédula)');
      if (!v.buyer.name) issue(['buyer', 'name'], 'La razón social o nombre es obligatorio');
    }
    if (cfg.buyerMode === 'optional_rnc' && rnc) {
      if (!rncValid) issue(['buyer', 'rnc'], 'Debe tener 9 dígitos (RNC) u 11 dígitos (cédula)');
      if (!v.buyer.name) issue(['buyer', 'name'], 'Indica el nombre del comprador cuando usas RNC o cédula');
    }
    if (cfg.buyerMode === 'foreign') {
      if (!v.buyer.name) issue(['buyer', 'name'], 'El nombre del beneficiario es obligatorio');
      if (!v.buyer.country) issue(['buyer', 'country'], 'Indica el país');
      if (!v.buyer.foreignId) issue(['buyer', 'foreignId'], 'Indica la identificación extranjera');
      else if (v.buyer.foreignId.length > 15) issue(['buyer', 'foreignId'], 'Máximo 15 caracteres');
    }
    if (cfg.buyerMode !== 'none' && v.buyer.email && !z.string().email().safeParse(v.buyer.email).success) {
      issue(['buyer', 'email'], 'Correo electrónico no válido');
    }

    if (v.paymentType === '2') {
      if (!cfg.allowsCredit) issue(['paymentType'], 'Este tipo de comprobante no admite pago a crédito');
      else if (v.paymentTermDays === undefined || Number.isNaN(v.paymentTermDays)) issue(['paymentTermDays'], 'Indica el plazo en días');
      else if (v.paymentTermDays < 1 || v.paymentTermDays > 365) issue(['paymentTermDays'], 'El plazo debe estar entre 1 y 365 días');
    }

    v.items.forEach((it, i) => {
      if (it.discount > it.quantity * it.unitPrice) issue(['items', i, 'discount'], 'El descuento supera el importe de la línea');
    });

    if (cfg.allowsRetentions) {
      const t = computeTotals(v.items);
      if (v.retentions.itbis > t.itbis) issue(['retentions', 'itbis'], 'No puede superar el ITBIS facturado');
      if (v.retentions.isr > t.taxable) issue(['retentions', 'isr'], 'No puede superar el monto gravado');
    }

    if (cfg.requiresReference) {
      const ncf = v.reference.modifiedNcf.toUpperCase();
      if (!ncf) issue(['reference', 'modifiedNcf'], 'Indica el e-NCF o NCF modificado');
      else if (!/^(E\d{12}|B\d{10})$/.test(ncf)) issue(['reference', 'modifiedNcf'], 'Formato no válido (ej.: E310000000001)');
      if (!v.reference.modifiedDate) issue(['reference', 'modifiedDate'], 'Indica la fecha del comprobante modificado');
      if (!v.reference.modificationCode) issue(['reference', 'modificationCode'], 'Selecciona el código de modificación');
      if (v.reference.reason.length < 3) issue(['reference', 'reason'], 'Describe la razón de la modificación');
    }
  });

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceItemValues = z.infer<typeof itemSchema>;

export const emptyItem = (): InvoiceItemValues => ({ code: undefined, description: '', kind: 'SERVICIO', quantity: 1, unitPrice: 0, discount: 0, itbisRate: 18 });

export const defaultValues = (type: EcfTypeCode = 'E31'): InvoiceFormValues => ({
  type,
  buyer: { partyId: undefined, rnc: '', name: '', email: '', foreignId: '', country: '' },
  incomeType: '01',
  paymentType: '1',
  paymentTermDays: undefined,
  items: [{ ...emptyItem(), itbisRate: type === 'E46' || type === 'E47' ? 0 : 18 }],
  retentions: { itbis: 0, isr: 0 },
  reference: { modifiedNcf: '', modifiedDate: '', modificationCode: '', reason: '' },
  notes: '',
});

export const isEcfCode = (v: string | null): v is EcfTypeCode => !!v && (ECF_CODES as readonly string[]).includes(v);

/** Convierte el formulario al borrador que espera el servicio, omitiendo secciones no aplicables al tipo. */
export function toDraft(v: InvoiceFormValues): InvoiceDraft {
  const cfg = ECF_TYPE_MAP[v.type];
  const clean = (s: string) => s.trim() || undefined;
  const buyer =
    cfg.buyerMode === 'none'
      ? {}
      : cfg.buyerMode === 'foreign'
        ? { name: clean(v.buyer.name), foreignId: clean(v.buyer.foreignId), country: clean(v.buyer.country), email: clean(v.buyer.email) }
        : { rnc: clean(v.buyer.rnc.replace(/[\s-]/g, '')), name: clean(v.buyer.name), email: clean(v.buyer.email) };
  return {
    type: v.type,
    buyer,
    incomeType: v.incomeType,
    paymentType: v.paymentType,
    paymentTermDays: v.paymentType === '2' && cfg.allowsCredit ? v.paymentTermDays : undefined,
    items: v.items.map((i) => ({ ...i, description: i.description.trim() })),
    retentions: cfg.allowsRetentions ? { itbis: v.retentions.itbis || 0, isr: v.retentions.isr || 0 } : { itbis: 0, isr: 0 },
    reference: cfg.requiresReference
      ? {
          modifiedNcf: v.reference.modifiedNcf.trim().toUpperCase(),
          modifiedDate: v.reference.modifiedDate,
          modificationCode: v.reference.modificationCode,
          reason: v.reference.reason.trim(),
        }
      : undefined,
    notes: v.notes.trim() || undefined,
  };
}

export function fromDraft(draft: InvoiceDraft): InvoiceFormValues {
  const defaults = defaultValues(draft.type);
  return {
    ...defaults,
    buyer: { ...defaults.buyer,
      rnc: draft.buyer.rnc ?? '', name: draft.buyer.name ?? '', email: draft.buyer.email ?? '',
      foreignId: draft.buyer.foreignId ?? '', country: draft.buyer.country ?? '' },
    incomeType: draft.incomeType || defaults.incomeType,
    paymentType: draft.paymentType || defaults.paymentType,
    paymentTermDays: draft.paymentTermDays,
    items: draft.items.length ? draft.items.map((item) => ({ ...emptyItem(), ...item })) : defaults.items,
    retentions: draft.retentions,
    reference: { ...defaults.reference, ...draft.reference },
    notes: draft.notes ?? '',
  };
}
