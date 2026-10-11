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
  createdAt: ISODate;
  documentsThisMonth: number;
  users: number;
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
