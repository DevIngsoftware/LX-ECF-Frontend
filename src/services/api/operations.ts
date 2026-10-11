import { ENV } from '@/constants/env';
import type { Page, PageQuery } from '@/types/common';
import type {
  Expense, ExpenseInput, ExportFormat, Party, PartyInput, PartyKind, PaymentInput, Product, ProductInput,
  ReceivablePayment, Receivable, ReceivedDocument, ReportData, ReportKey, RncLookupResult,
} from '@/types/business';
import type { InvoiceSummary } from '@/types/ecf';
import { get, getBlob, patch, post, put } from '../http/client';
import { ApiError, toApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { customers, expenseCategories, expenses, invoices, payments, products, receivables, receivedDocuments, suppliers } from '../mocks/data';
import { buildReport } from '../mocks/reports';
import { daysAgo, delay, paginate, uid } from '../mocks/utils';

type ActiveFilter = { active?: 'all' | 'active' | 'inactive' };

export interface PartiesService {
  list(kind: PartyKind, query: PageQuery & ActiveFilter): Promise<Page<Party>>;
  get(kind: PartyKind, id: string): Promise<Party>;
  create(kind: PartyKind, input: PartyInput): Promise<Party>;
  update(kind: PartyKind, id: string, input: PartyInput): Promise<Party>;
  setActive(kind: PartyKind, id: string, active: boolean): Promise<void>;
  history(kind: PartyKind, id: string): Promise<InvoiceSummary[]>;
  lookupRnc(rnc: string): Promise<RncLookupResult | null>;
}

export interface CatalogService {
  list(query: PageQuery & ActiveFilter & { kind?: string }): Promise<Page<Product>>;
  create(input: ProductInput): Promise<Product>;
  update(id: string, input: ProductInput): Promise<Product>;
  setActive(id: string, active: boolean): Promise<void>;
}

export interface ReceptionService {
  list(query: PageQuery & { status?: string }): Promise<Page<ReceivedDocument>>;
  downloadXml(id: string): Promise<Blob>;
}

export interface ReceivablesService {
  list(query: PageQuery & { status?: string }): Promise<Page<Receivable>>;
  payments(): Promise<ReceivablePayment[]>;
  registerPayment(input: PaymentInput): Promise<ReceivablePayment>;
}

export interface ExpensesService {
  list(query: PageQuery & { category?: string; from?: string; to?: string }): Promise<Page<Expense>>;
  categories(): Promise<string[]>;
  create(input: ExpenseInput): Promise<Expense>;
}

export interface ReportsService {
  get(key: ReportKey, range: { from: string; to: string }): Promise<ReportData>;
  export(key: ReportKey, format: ExportFormat, range: { from: string; to: string }): Promise<Blob>;
}

const http = {
  parties: {
    list: (kind, params) => get(ENDPOINTS.parties(kind), { params }),
    get: (kind, id) => get(`${ENDPOINTS.parties(kind)}/${id}`),
    create: (kind, input) => post(ENDPOINTS.parties(kind), input),
    update: (kind, id, input) => put(`${ENDPOINTS.parties(kind)}/${id}`, input),
    setActive: (kind, id, active) => patch(`${ENDPOINTS.parties(kind)}/${id}/estado`, { active }),
    history: (kind, id) => get(`${ENDPOINTS.parties(kind)}/${id}/comprobantes`),
    lookupRnc: (rnc) => get(ENDPOINTS.rncLookup(rnc)),
  } satisfies PartiesService,
  catalog: {
    list: (params) => get(ENDPOINTS.catalog, { params }),
    create: (input) => post(ENDPOINTS.catalog, input),
    update: (id, input) => put(`${ENDPOINTS.catalog}/${id}`, input),
    setActive: (id, active) => patch(`${ENDPOINTS.catalog}/${id}/estado`, { active }),
  } satisfies CatalogService,
  reception: {
    list: (params) => get(ENDPOINTS.reception, { params }),
    downloadXml: (id) => getBlob(`${ENDPOINTS.reception}/${id}/xml`),
  } satisfies ReceptionService,
  receivables: {
    list: (params) => get(ENDPOINTS.receivables.list, { params }),
    payments: () => get(ENDPOINTS.receivables.payments),
    registerPayment: (input) => post(ENDPOINTS.receivables.payments, input),
  } satisfies ReceivablesService,
  expenses: {
    list: (params) => get(ENDPOINTS.expenses, { params }),
    categories: () => get(`${ENDPOINTS.expenses}/categorias`),
    create: (input) => post(ENDPOINTS.expenses, input),
  } satisfies ExpensesService,
  reports: {
    get: (key, params) => get(ENDPOINTS.reports(key), { params }),
    export: (key, format, params) => getBlob(ENDPOINTS.reportExport(key, format), { params }),
  } satisfies ReportsService,
};

const store = (kind: PartyKind) => (kind === 'customers' ? customers : suppliers);
const byActive = <T extends { active: boolean }>(list: T[], f?: ActiveFilter['active']) =>
  f === 'active' ? list.filter((x) => x.active) : f === 'inactive' ? list.filter((x) => !x.active) : list;

const mock = {
  parties: {
    async list(kind, q) {
      await delay();
      return paginate(byActive(store(kind), q.active), q, ['rnc', 'legalName', 'tradeName', 'email']);
    },
    async get(kind, id) {
      await delay(300);
      const p = store(kind).find((x) => x.id === id);
      if (!p) throw new ApiError('not_found', 'El registro no existe.', 404);
      return p;
    },
    async create(kind, input) {
      await delay(600);
      const p: Party = { ...input, id: uid(), createdAt: new Date().toISOString(), totalAmount: 0, documentsCount: 0 };
      store(kind).unshift(p);
      return p;
    },
    async update(kind, id, input) {
      await delay(600);
      const list = store(kind);
      const idx = list.findIndex((x) => x.id === id);
      list[idx] = { ...list[idx], ...input };
      return list[idx];
    },
    async setActive(kind, id, active) {
      await delay(400);
      const p = store(kind).find((x) => x.id === id);
      if (p) p.active = active;
    },
    async history(kind, id) {
      await delay(400);
      const p = store(kind).find((x) => x.id === id);
      return kind === 'customers' ? invoices.filter((i) => i.buyerRnc === p?.rnc).slice(0, 15) : [];
    },
    async lookupRnc() {
      await delay(500);
      return null;
    },
  } satisfies PartiesService,
  catalog: {
    async list(q) {
      await delay();
      let list = byActive(products, q.active);
      if (q.kind && q.kind !== 'ALL') list = list.filter((p) => p.kind === q.kind);
      return paginate(list, q, ['code', 'name', 'category']);
    },
    async create(input) {
      await delay(500);
      const p = { ...input, id: uid() };
      products.unshift(p);
      return p;
    },
    async update(id, input) {
      await delay(500);
      const idx = products.findIndex((p) => p.id === id);
      products[idx] = { ...products[idx], ...input };
      return products[idx];
    },
    async setActive(id, active) {
      await delay(300);
      const p = products.find((x) => x.id === id);
      if (p) p.active = active;
    },
  } satisfies CatalogService,
  reception: {
    async list(q) {
      await delay();
      const list = q.status && q.status !== 'ALL' ? receivedDocuments.filter((d) => d.status === q.status) : receivedDocuments;
      return paginate(list, q, ['encf', 'supplierName', 'supplierRnc']);
    },
    async downloadXml(id) {
      await delay(400);
      return new Blob([`<!-- XML de demostración ${id} sin validez fiscal -->`], { type: 'application/xml' });
    },
  } satisfies ReceptionService,
  receivables: {
    async list(q) {
      await delay();
      const list = q.status && q.status !== 'ALL' ? receivables.filter((r) => r.status === q.status) : receivables;
      return paginate(list, { sort: 'dueDate', direction: 'asc', ...q }, ['encf', 'customerName']);
    },
    async payments() {
      await delay(400);
      return [...payments].sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    async registerPayment(input) {
      await delay(700);
      const r = receivables.find((x) => x.id === input.receivableId);
      if (!r) throw new ApiError('not_found', 'La cuenta por cobrar no existe.', 404);
      if (input.amount > r.balance) throw new ApiError('validation', 'El monto supera el saldo pendiente.', 400);
      r.paid += input.amount;
      r.balance -= input.amount;
      r.status = r.balance <= 0 ? 'PAGADA' : 'PARCIAL';
      const p = { ...input, id: uid(), encf: r.encf };
      payments.unshift(p);
      return p;
    },
  } satisfies ReceivablesService,
  expenses: {
    async list(q) {
      await delay();
      let list = expenses;
      if (q.category && q.category !== 'ALL') list = list.filter((e) => e.category === q.category);
      if (q.from) list = list.filter((e) => e.date >= q.from!);
      if (q.to) list = list.filter((e) => e.date <= q.to!);
      return paginate(list, { sort: 'date', ...q }, ['description', 'supplierName', 'ncf']);
    },
    async categories() {
      await delay(150);
      return expenseCategories;
    },
    async create(input) {
      await delay(600);
      const e = { ...input, id: uid(), date: input.date || daysAgo(0) };
      expenses.unshift(e);
      return e;
    },
  } satisfies ExpensesService,
  reports: {
    async get(key, range) {
      await delay(600);
      return buildReport(key, range);
    },
    async export(key, format) {
      await delay(500);
      throw new ApiError('server', `La exportación ${format.toUpperCase()} estará disponible cuando el backend habilite este servicio.`, 503);
    },
  } satisfies ReportsService,
};

const impl = ENV.useMocks ? mock : http;
const portalCustomers: PartiesService = {
  list: (_kind, params) => get(ENDPOINTS.invoiceCustomers, { params }),
  get: (_kind, id) => get(`${ENDPOINTS.invoiceCustomers}/${encodeURIComponent(id)}`),
  create: (_kind, input) => post(ENDPOINTS.invoiceCustomers, input),
  update: (_kind, id, input) => put(`${ENDPOINTS.invoiceCustomers}/${encodeURIComponent(id)}`, input),
  setActive: (_kind, id, active) => patch(`${ENDPOINTS.invoiceCustomers}/${encodeURIComponent(id)}/estado`, { active }),
  history: (_kind, id) => get(`${ENDPOINTS.invoiceCustomers}/${encodeURIComponent(id)}/comprobantes`),
  async lookupRnc(rnc) {
    try {
      const result = await get<{ rnc: string; razonSocial: string; estado?: string }>(`/rnc/${encodeURIComponent(rnc)}`);
      return { rnc: result.rnc, legalName: result.razonSocial, status: result.estado };
    } catch (error) {
      if (toApiError(error).kind === 'not_found') return null;
      throw error;
    }
  },
};
export const partiesService: PartiesService = ENV.invoicesUseMocks ? impl.parties : {
  list: (kind, query) => kind === 'customers' ? portalCustomers.list(kind, query) : impl.parties.list(kind, query),
  get: (kind, id) => kind === 'customers' ? portalCustomers.get(kind, id) : impl.parties.get(kind, id),
  create: (kind, input) => kind === 'customers' ? portalCustomers.create(kind, input) : impl.parties.create(kind, input),
  update: (kind, id, input) => kind === 'customers' ? portalCustomers.update(kind, id, input) : impl.parties.update(kind, id, input),
  setActive: (kind, id, active) => kind === 'customers' ? portalCustomers.setActive(kind, id, active) : impl.parties.setActive(kind, id, active),
  history: (kind, id) => kind === 'customers' ? portalCustomers.history(kind, id) : impl.parties.history(kind, id),
  lookupRnc: portalCustomers.lookupRnc,
};
export const catalogService: CatalogService = impl.catalog;
export const receptionService: ReceptionService = impl.reception;
export const receivablesService: ReceivablesService = impl.receivables;
export const expensesService: ExpensesService = impl.expenses;
export const reportsService: ReportsService = impl.reports;
