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
import { customers, invoices, suppliers } from '../mocks/data';
import { buildReport } from '../mocks/reports';
import { delay, paginate, uid } from '../mocks/utils';

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
  summary(): Promise<ReceivablesSummary>;
  payments(): Promise<ReceivablePayment[]>;
  registerPayment(input: PaymentInput): Promise<ReceivablePayment>;
}

export interface ReceivablesSummary {
  outstanding: number;
  overdue: number;
  overdueCount: number;
  collectedMonth: number;
  openCount: number;
  aging: { key: string; label: string; amount: number; count: number }[];
}

export interface ExpensesService {
  list(query: PageQuery & { category?: string; from?: string; to?: string }): Promise<Page<Expense>>;
  categories(): Promise<string[]>;
  summary(query: { category?: string; from?: string; to?: string }): Promise<ExpenseSummary>;
  create(input: ExpenseInput): Promise<Expense>;
}

export interface ExpenseSummary {
  total: number;
  itbis: number;
  count: number;
  byCategory: { category: string; amount: number }[];
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
    summary: () => get(`${ENDPOINTS.receivables.list}/resumen`),
    payments: () => get(ENDPOINTS.receivables.payments),
    registerPayment: (input) => post(ENDPOINTS.receivables.payments, input),
  } satisfies ReceivablesService,
  expenses: {
    list: (params) => get(ENDPOINTS.expenses, { params }),
    categories: () => get(`${ENDPOINTS.expenses}/categorias`),
    summary: (params) => get(`${ENDPOINTS.expenses}/resumen`, { params }),
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
    list: (query) => http.catalog.list(query),
    create: (input) => http.catalog.create(input),
    update: (id, input) => http.catalog.update(id, input),
    setActive: (id, active) => http.catalog.setActive(id, active),
  } satisfies CatalogService,
  receivables: {
    list: (params) => http.receivables.list(params),
    summary: () => http.receivables.summary(),
    payments: () => http.receivables.payments(),
    registerPayment: (input) => http.receivables.registerPayment(input),
  } satisfies ReceivablesService,
  expenses: {
    list: (params) => http.expenses.list(params),
    categories: () => http.expenses.categories(),
    summary: (params) => http.expenses.summary(params),
    create: (input) => http.expenses.create(input),
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
const activeCustomers = ENV.invoicesUseMocks ? impl.parties : portalCustomers;
export const partiesService: PartiesService = {
  list: (kind, query) => kind === 'customers' ? activeCustomers.list(kind, query) : http.parties.list(kind, query),
  get: (kind, id) => kind === 'customers' ? activeCustomers.get(kind, id) : http.parties.get(kind, id),
  create: (kind, input) => kind === 'customers' ? activeCustomers.create(kind, input) : http.parties.create(kind, input),
  update: (kind, id, input) => kind === 'customers' ? activeCustomers.update(kind, id, input) : http.parties.update(kind, id, input),
  setActive: (kind, id, active) => kind === 'customers' ? activeCustomers.setActive(kind, id, active) : http.parties.setActive(kind, id, active),
  history: (kind, id) => kind === 'customers' ? activeCustomers.history(kind, id) : http.parties.history(kind, id),
  lookupRnc: portalCustomers.lookupRnc,
};
export const catalogService: CatalogService = http.catalog;
export const receptionService: ReceptionService = http.reception;
export const receivablesService: ReceivablesService = http.receivables;
export const expensesService: ExpensesService = http.expenses;
export const reportsService: ReportsService = impl.reports;
