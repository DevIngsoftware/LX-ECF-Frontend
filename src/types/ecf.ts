import type { Id, ISODate, OpenString } from './common';

export type EcfTypeCode = 'E31' | 'E32' | 'E33' | 'E34' | 'E41' | 'E43' | 'E44' | 'E45' | 'E46' | 'E47';

export type InternalStatus = OpenString<'CREADO' | 'ACEPTADO' | 'RECHAZADO'>;
export type DgiiStatus = OpenString<'ACEPTADO' | 'RECHAZADO' | 'ACEPTADO_CONDICIONAL' | 'EN_PROCESO' | 'NO_ENVIADO'>;
export type PaymentStatus = OpenString<'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA'>;
export type ItemKind = 'BIEN' | 'SERVICIO';

export interface DgiiMessage {
  code?: string;
  message: string;
  /** Explicación comprensible, si el backend la proporciona. */
  explanation?: string;
}

export interface InvoiceEvent {
  at: ISODate;
  type: string;
  description: string;
  actor?: string;
}

export interface InvoiceItem {
  id?: Id;
  code?: string;
  description: string;
  kind: ItemKind;
  quantity: number;
  unitPrice: number;
  discount: number;
  itbisRate: number;
}

export interface InvoiceReference {
  modifiedNcf: string;
  modifiedDate: ISODate;
  modificationCode: string;
  reason: string;
}

export interface InvoiceParty {
  rnc?: string;
  name?: string;
  email?: string;
  foreignId?: string;
  country?: string;
}

export interface InvoiceSummary {
  id: Id;
  encf: string;
  type: EcfTypeCode;
  buyerName: string;
  buyerRnc?: string;
  issueDate: ISODate;
  total: number;
  itbis: number;
  internalStatus: InternalStatus;
  dgiiStatus?: DgiiStatus;
  trackId?: string;
  paymentStatus?: PaymentStatus;
}

export interface InvoiceDetail extends InvoiceSummary {
  buyer: InvoiceParty;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  itbisRetained: number;
  isrRetained: number;
  incomeType: string;
  paymentType: string;
  paymentTermDays?: number;
  reference?: InvoiceReference;
  notes?: string;
  securityCode?: string;
  signedAt?: ISODate;
  verificationUrl?: string;
  qrImageUrl?: string;
  history: InvoiceEvent[];
  dgiiMessages: DgiiMessage[];
}

export interface InvoiceDraft {
  type: EcfTypeCode;
  buyer: InvoiceParty;
  incomeType: string;
  paymentType: string;
  paymentTermDays?: number;
  items: InvoiceItem[];
  retentions: { itbis: number; isr: number };
  reference?: InvoiceReference;
  notes?: string;
}

export interface SavedInvoiceDraft {
  id: string;
  type: EcfTypeCode;
  buyerName: string;
  updatedAt: ISODate;
}

export interface InvoiceFilters {
  search?: string;
  type?: EcfTypeCode | 'ALL';
  internalStatus?: string;
  dgiiStatus?: string;
  from?: ISODate;
  to?: ISODate;
}

export interface PreValidationResult {
  valid: boolean;
  messages: DgiiMessage[];
}

export interface EmitResult {
  id: Id;
  encf?: string;
  internalStatus: InternalStatus;
  dgiiStatus?: DgiiStatus;
  trackId?: string;
  messages: DgiiMessage[];
}

export interface TrackStatusResult {
  trackId: string;
  dgiiStatus: DgiiStatus;
  messages: DgiiMessage[];
  checkedAt: ISODate;
}

export interface Sequence {
  type: EcfTypeCode;
  rangeFrom: string;
  rangeTo: string;
  current: string;
  remaining: number;
  expiresAt?: ISODate;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  serial?: string;
  validFrom: ISODate;
  validTo: ISODate;
}

export type DgiiEnvironment = OpenString<'TesteCF' | 'CerteCF' | 'eCF'>;

export interface DgiiOverview {
  configured: boolean;
  environment: DgiiEnvironment | null;
  certificate: CertificateInfo | null;
  sequences: Sequence[];
  statusCounts: { status: string; count: number }[];
  recentRejections: InvoiceSummary[];
  events: InvoiceEvent[];
}
