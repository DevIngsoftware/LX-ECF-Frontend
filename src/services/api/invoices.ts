import { ENV } from '@/constants/env';
import type { Page, PageQuery, DateRange } from '@/types/common';
import type {
  DgiiOverview, EmitResult, InvoiceDetail, InvoiceDraft, InvoiceFilters, InvoiceSummary, PreValidationResult, TrackStatusResult,
} from '@/types/ecf';
import type { DashboardOverview } from '@/types/business';
import { get, getBlob, post } from '../http/client';
import { ApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { toFacturaRequestDTO } from '../adapters/invoice.adapter';
import { invoices } from '../mocks/data';
import { buildDashboard, buildDgiiOverview } from '../mocks/aggregates';
import { daysAgo, delay, demoBlob, paginate, uid } from '../mocks/utils';

export interface InvoicesService {
  list(query: PageQuery & InvoiceFilters): Promise<Page<InvoiceSummary>>;
  get(id: string): Promise<InvoiceDetail>;
  validate(draft: InvoiceDraft): Promise<PreValidationResult>;
  saveDraft(draft: InvoiceDraft): Promise<{ id: string }>;
  /** Nunca se reintenta automáticamente para evitar emisiones duplicadas. */
  emit(draft: InvoiceDraft, idempotencyKey: string): Promise<EmitResult>;
  send(id: string): Promise<InvoiceDetail>;
  checkStatus(id: string): Promise<TrackStatusResult>;
  downloadPdf(id: string): Promise<Blob>;
  downloadXml(id: string): Promise<Blob>;
  dashboard(range: DateRange): Promise<DashboardOverview>;
  dgiiOverview(): Promise<DgiiOverview>;
  track(trackId: string): Promise<TrackStatusResult>;
}

function localDate(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const httpInvoices: InvoicesService = {
  list: (params) => {
    return get(ENDPOINTS.invoices.list, { params: { ...params, from: localDate(params.from), to: localDate(params.to) } });
  },
  get: (id) => get(ENDPOINTS.invoices.detail(id)),
  validate: (draft) => post(ENDPOINTS.invoices.validate, toFacturaRequestDTO(draft)),
  saveDraft: (draft) => post(ENDPOINTS.invoices.draft, toFacturaRequestDTO(draft)),
  emit: (draft, key) => post(ENDPOINTS.invoices.emit, toFacturaRequestDTO(draft), { headers: { 'Idempotency-Key': key }, timeout: 60000 }),
  send: (id) => post(ENDPOINTS.invoices.send(id), undefined, { timeout: 60000 }),
  checkStatus: (id) => get(ENDPOINTS.invoices.status(id)),
  downloadPdf: (id) => getBlob(ENDPOINTS.invoices.pdf(id), { headers: { Accept: 'application/pdf, application/json' } }),
  downloadXml: (id) => getBlob(ENDPOINTS.invoices.xml(id), { headers: { Accept: 'application/xml, application/json' } }),
  dashboard: (range) => get(ENDPOINTS.dashboard, { params: { from: localDate(range.from), to: localDate(range.to) } }),
  dgiiOverview: () => get(ENDPOINTS.dgii.overview),
  track: (trackId) => get(ENDPOINTS.dgii.track(trackId)),
};

export interface SavedInvoiceCustomer {
  id: string;
  rnc: string;
  legalName: string;
  email?: string;
}

export const invoiceCustomersService = {
  async list(search?: string): Promise<Page<SavedInvoiceCustomer>> {
    return get<Page<SavedInvoiceCustomer>>(ENDPOINTS.invoiceCustomers, {
      params: { page: 0, size: 8, search: search || undefined, active: 'active' },
    });
  },
};

const DEMO_NOTICE = { code: 'DEMO', message: 'Respuesta de demostración. No proviene de la DGII.' };
let demoSequence = 9000000000;

function findInvoice(id: string) {
  const inv = invoices.find((i) => i.id === id);
  if (!inv) throw new ApiError('not_found', 'El comprobante no existe.', 404);
  return inv;
}

const mockInvoices: InvoicesService = {
  async list(query) {
    await delay();
    let list: InvoiceSummary[] = invoices;
    if (query.type && query.type !== 'ALL') list = list.filter((i) => i.type === query.type);
    if (query.internalStatus) list = list.filter((i) => i.internalStatus === query.internalStatus);
    if (query.dgiiStatus) list = list.filter((i) => (i.dgiiStatus ?? 'NO_ENVIADO') === query.dgiiStatus);
    if (query.from) list = list.filter((i) => i.issueDate >= query.from!);
    if (query.to) list = list.filter((i) => i.issueDate <= query.to!);
    return paginate(list, { sort: 'issueDate', ...query }, ['encf', 'buyerName', 'buyerRnc']);
  },
  async get(id) {
    await delay(350);
    return findInvoice(id);
  },
  async validate(draft) {
    await delay(600);
    const messages = [{ code: 'DEMO', message: 'Validación de demostración: la validación fiscal definitiva la realiza el backend.' }];
    if (!draft.items.length) messages.push({ code: 'UX', message: 'Agrega al menos un artículo.' });
    return { valid: draft.items.length > 0, messages };
  },
  async saveDraft() {
    await delay(500);
    return { id: `draft-${uid()}` };
  },
  async emit(draft) {
    await delay(1600);
    const id = `inv-demo-${uid()}`;
    const subtotal = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice - i.discount, 0);
    const itbis = draft.items.reduce((s, i) => s + (i.quantity * i.unitPrice - i.discount) * (i.itbisRate / 100), 0);
    invoices.unshift({
      id, encf: `${draft.type}${++demoSequence}`, type: draft.type, buyerName: draft.buyer.name ?? 'Sin nombre', buyerRnc: draft.buyer.rnc,
      issueDate: daysAgo(0), total: subtotal + itbis, itbis, internalStatus: 'CREADO', dgiiStatus: 'NO_ENVIADO',
      buyer: draft.buyer, items: draft.items, subtotal, discountTotal: draft.items.reduce((s, i) => s + i.discount, 0),
      itbisRetained: draft.retentions.itbis, isrRetained: draft.retentions.isr, incomeType: draft.incomeType, paymentType: draft.paymentType,
      paymentTermDays: draft.paymentTermDays, reference: draft.reference,
      history: [{ at: daysAgo(0), type: 'CREADO', description: 'Registrado en modo demostración. No fue firmado ni enviado a la DGII.' }],
      dgiiMessages: [DEMO_NOTICE],
    });
    return { id, internalStatus: 'CREADO', dgiiStatus: 'NO_ENVIADO', messages: [{ code: 'DEMO', message: 'Modo demostración: el comprobante se registró localmente y NO fue enviado a la DGII.' }] };
  },
  async send() { throw new ApiError('validation', 'El envío DGII no está disponible en la demostración.', 400); },
  async checkStatus(id) {
    await delay(900);
    const inv = findInvoice(id);
    return { trackId: inv.trackId ?? '—', dgiiStatus: inv.dgiiStatus ?? 'NO_ENVIADO', messages: [DEMO_NOTICE, ...inv.dgiiMessages], checkedAt: new Date().toISOString() };
  },
  async downloadPdf(id) {
    await delay(500);
    const inv = findInvoice(id);
    return demoBlob(`Representación impresa ${inv.encf}`, `Comprador: ${inv.buyerName}\nTotal: ${inv.total}`, 'application/pdf');
  },
  async downloadXml(id) {
    await delay(500);
    const inv = findInvoice(id);
    return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n<!-- DOCUMENTO DE DEMOSTRACIÓN SIN VALIDEZ FISCAL. El XML oficial lo genera y firma el backend. -->\n<Demo><eNCF>${inv.encf}</eNCF></Demo>`], { type: 'application/xml' });
  },
  async dashboard(range) {
    await delay(600);
    return buildDashboard(range);
  },
  async dgiiOverview() {
    await delay(500);
    return buildDgiiOverview();
  },
  async track(trackId) {
    await delay(900);
    const inv = invoices.find((i) => i.trackId === trackId.trim());
    if (!inv) throw new ApiError('not_found', 'No se encontró ningún envío con ese trackId en los datos de demostración.', 404);
    return { trackId, dgiiStatus: inv.dgiiStatus ?? 'NO_ENVIADO', messages: [DEMO_NOTICE, ...inv.dgiiMessages], checkedAt: new Date().toISOString() };
  },
};

export const invoicesService: InvoicesService = {
  ...(ENV.invoicesUseMocks ? mockInvoices : httpInvoices),
  dashboard: ENV.invoicesUseMocks ? mockInvoices.dashboard : httpInvoices.dashboard,
  dgiiOverview: ENV.settingsUseMocks ? mockInvoices.dgiiOverview : httpInvoices.dgiiOverview,
  track: ENV.settingsUseMocks ? mockInvoices.track : httpInvoices.track,
};
