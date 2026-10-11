import type { Id, ISODate, OpenString } from './common';
import type { AdminRole, ModuleKey } from './account';

export interface ApiCredential {
  id: Id;
  name: string;
  prefix: string;
  environment: 'sandbox' | 'production';
  createdAt: ISODate;
  lastUsedAt?: ISODate;
  status: OpenString<'ACTIVA' | 'REVOCADA'>;
}

/** El secreto llega una sola vez desde el backend y nunca se guarda. */
export interface CreatedCredential {
  credential: ApiCredential;
  apiKey: string;
  secret: string;
}

export interface ApiUsagePoint {
  date: string;
  requests: number;
  errors: number;
}

export interface ApiLogEntry {
  id: Id;
  at: ISODate;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
}

export interface AdminCompany {
  id: Id;
  name: string;
  rnc: string;
  status: OpenString<'ACTIVA' | 'PRUEBA' | 'SUSPENDIDA' | 'ONBOARDING'>;
  plan: string;
  modules: ModuleKey[];
  subscriptionStatus?: string | null;
  renewalDate?: ISODate | null;
  createdAt: ISODate;
  documentsThisMonth: number;
  users: number;
  dgiiEnvironment?: string;
  requestedDgiiEnvironment?: string;
}

export interface AdminDashboard {
  companies: number;
  activeCompanies: number;
  activeSubscriptions: number;
  documentsProcessed: number;
  apiRequests: number;
  subscriptionRevenue: number;
  openIncidents: number;
  trend: { date: string; documents: number; api: number }[];
  planDistribution: { plan: string; companies: number }[];
}

/** Indicadores administrativos que la API ya puede calcular con datos reales. */
export interface AdminDashboardOverview {
  companies: number;
  configuredCompanies: number;
  documentsThisMonth: number;
  trend: { date: string; documents: number }[];
}

export interface AdminSubscription {
  id: Id;
  company: string;
  plan: string;
  status: string;
  renewalDate: ISODate;
  lastPaymentAt?: ISODate;
  amount: number;
}

export interface InternalUser {
  id: Id;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: ISODate;
  emailVerified?: boolean;
  pendingEmail?: string | null;
  emailSent?: boolean;
}

export interface SupportTicket {
  id: Id;
  subject: string;
  company: string;
  priority: OpenString<'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'>;
  status: OpenString<'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO'>;
  createdAt: ISODate;
  updatedAt: ISODate;
  assignee?: string;
}

export interface SupportMessage {
  id: Id;
  author: string;
  portal: 'tenant' | 'admin';
  body: string;
  createdAt: ISODate;
}

export interface SupportTicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
  moduleRequest?: { key: ModuleKey; enabled: boolean; subscriptionActive: boolean } | null;
  paymentRequest?: {
    id: Id;
    kind: 'PLAN' | 'MODULE';
    planId?: Id | null;
    planName?: string | null;
    moduleKey?: ModuleKey | null;
    bankName: string;
    accountNumber: string;
    amount: number;
    reference?: string | null;
    filename: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: ISODate;
    reviewNote?: string | null;
  } | null;
}

export interface BankAccount {
  id: Id;
  bankName: string;
  accountType: string;
  accountNumber: string;
  beneficiary: string;
  currency: string;
  active: boolean;
  sortOrder: number;
}

export interface AuditEvent {
  id: Id;
  at: ISODate;
  actor: string;
  action: string;
  target: string;
  ip?: string;
  category: OpenString<'ACCESO' | 'CAMBIO' | 'EVENTO'>;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  maintenanceMode: boolean;
  allowSelfSignup: boolean;
}

export interface ChatMessage {
  id: Id;
  role: 'user' | 'assistant';
  content: string;
  createdAt: ISODate;
  error?: boolean;
}
