import type { Id, ISODate, OpenString, Severity } from './common';
import type { EcfTypeCode, ItemKind, PaymentStatus } from './ecf';

export interface Party {
  id: Id;
  rnc: string;
  legalName: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: ISODate;
  totalAmount?: number;
  documentsCount?: number;
}

export type PartyInput = Omit<Party, 'id' | 'createdAt' | 'totalAmount' | 'documentsCount'>;
export type PartyKind = 'customers' | 'suppliers';

export interface RncLookupResult {
  rnc: string;
  legalName: string;
  tradeName?: string;
  status?: string;
}

export interface Product {
  id: Id;
  code: string;
  name: string;
  kind: ItemKind;
  price: number;
  itbisRate: number;
  category?: string;
  description?: string;
  active: boolean;
}

export type ProductInput = Omit<Product, 'id'>;

export interface ReceivedDocument {
  id: Id;
  encf: string;
  type: EcfTypeCode;
  supplierName: string;
  supplierRnc: string;
  issueDate: ISODate;
  receivedAt: ISODate;
  total: number;
  itbis: number | null;
  status: OpenString<'RECIBIDO' | 'ACEPTADO' | 'RECHAZADO' | 'EN_REVISION'>;
  hasPdf: boolean;
}

export interface Receivable {
  id: Id;
  invoiceId: Id;
  encf: string;
  customerName: string;
  issueDate: ISODate;
  dueDate: ISODate;
  total: number;
  paid: number;
  balance: number;
  status: PaymentStatus;
}

export interface ReceivablePayment {
  id: Id;
  receivableId: Id;
  encf: string;
  date: ISODate;
  amount: number;
  method: string;
  reference?: string;
}

export interface PaymentInput {
  receivableId: Id;
  date: ISODate;
  amount: number;
  method: string;
  reference?: string;
}

export interface Expense {
  id: Id;
  date: ISODate;
  supplierName?: string;
  supplierRnc?: string;
  category: string;
  description: string;
  amount: number;
  itbis: number;
  ncf?: string;
}

export type ExpenseInput = Omit<Expense, 'id'>;

export interface DashboardAlert {
  id: Id;
  severity: Severity;
  title: string;
  description: string;
  link?: string;
}

export interface DashboardSummary {
  totalInvoiced: number;
  invoicesIssued: number;
  accepted: number;
  rejected: number;
  pending: number;
  itbis: number;
  receivables: number;
  collected: number;
  trend: { date: string; invoiced: number; collected: number }[];
  byType: { type: EcfTypeCode; count: number; amount: number }[];
  alerts: DashboardAlert[];
}

/** Campos que ya tienen una fuente real en el panel del portal. */
export type DashboardOverview = Pick<DashboardSummary, 'totalInvoiced' | 'invoicesIssued' | 'accepted' | 'pending' | 'alerts'>;

export type ReportKey = 'sales' | 'types' | 'taxes' | 'customers' | 'expenses' | 'receivables' | 'dgii' | 'trends';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportData {
  key: ReportKey;
  columns: { key: string; label: string; numeric?: boolean }[];
  rows: Record<string, string | number>[];
  chart?: { label: string; value: number }[];
}
