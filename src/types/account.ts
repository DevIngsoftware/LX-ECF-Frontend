import type { Id, ISODate, OpenString, Severity } from './common';

export type Portal = 'tenant' | 'admin';
export type TenantRole = 'ADMIN' | 'FACTURACION' | 'CONTABILIDAD' | 'CONSULTA';
export type AdminRole = 'SUPERADMIN' | 'SOPORTE' | 'COMERCIAL' | 'FINANZAS';

export type Permission =
  | 'invoices.read'
  | 'invoices.emit'
  | 'parties.read'
  | 'parties.write'
  | 'catalog.write'
  | 'reports.read'
  | 'receivables.write'
  | 'expenses.write'
  | 'dgii.manage'
  | 'users.manage'
  | 'settings.manage'
  | 'billing.manage'
  | 'developers.manage'
  | 'support.access'
  | 'catalog.read'
  | 'expenses.read'
  | 'receivables.read'
  | 'admin.access'
  | 'admin.companies'
  | 'admin.plans'
  | 'admin.plans.write'
  | 'admin.users'
  | 'admin.audit'
  | 'admin.support'
  | 'admin.settings';

export type ModuleKey = 'reception' | 'receivables' | 'catalog' | 'advanced_reports' | 'api' | 'expenses';

export interface TenantInfo {
  name: string;
  rnc: string;
  onboardingComplete: boolean;
  /** Lo determina el backend tras verificar certificado, secuencias y habilitación. */
  canIssue: boolean;
}

export interface SessionUser {
  id: Id;
  name: string;
  email: string;
  portal: Portal;
  role: TenantRole | AdminRole;
  permissions: Permission[];
  modules: ModuleKey[];
  tenant?: TenantInfo;
}

export interface LoginInput {
  identifier: string;
  password: string;
  remember: boolean;
}

export interface RegisterInput {
  companyName: string;
  rnc: string;
  ownerName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface TenantUser {
  id: Id;
  name: string;
  email: string;
  role: TenantRole;
  active: boolean;
  lastLoginAt?: ISODate;
  permissions?: Permission[];
}

export type TenantUserInput = Pick<TenantUser, 'name' | 'email' | 'role' | 'active'>;

export interface AppNotification {
  id: Id;
  category: OpenString<'DGII' | 'CERTIFICADO' | 'SECUENCIAS' | 'SUSCRIPCION' | 'SEGURIDAD' | 'ADMIN'>;
  severity: Severity;
  title: string;
  message: string;
  createdAt: ISODate;
  read: boolean;
  link?: string;
}

export type ModuleStatus = OpenString<'ACTIVO' | 'DISPONIBLE' | 'SOLICITADO' | 'PROXIMAMENTE'>;

export interface ModuleInfo {
  key: ModuleKey;
  name: string;
  description: string;
  benefits: string[];
  requirements: string[];
  status: ModuleStatus;
  availability: string;
}

export interface Plan {
  id: Id;
  name: string;
  description: string;
  /** null = precio no publicado; se muestra "Consultar". */
  priceLabel: string | null;
  invoiceLimit: number | null;
  userLimit: number | null;
  modules: ModuleKey[];
  active: boolean;
  highlighted?: boolean;
}

export interface Subscription {
  planId: Id;
  planName: string;
  status: OpenString<'ACTIVA' | 'PRUEBA' | 'VENCIDA' | 'SUSPENDIDA' | 'CANCELADA'>;
  startedAt: ISODate;
  renewalDate: ISODate;
  documentsUsed: number;
  documentsLimit: number | null;
  usersUsed: number;
  usersLimit: number | null;
  modules: ModuleKey[];
}

export interface ServiceInvoice {
  id: Id;
  number: string;
  date: ISODate;
  concept: string;
  amount: number;
  status: OpenString<'PAGADA' | 'PENDIENTE' | 'VENCIDA'>;
}

export interface SubscriptionPayment {
  id: Id;
  reference: string;
  date: ISODate;
  method: string;
  simulated: boolean;
}

export interface CompanySettings {
  legalName: string;
  tradeName?: string;
  rnc: string;
  email: string;
  phone?: string;
  address?: string;
  economicActivity?: string;
  defaultPaymentTermDays: number;
  defaultItbisRate: number;
  invoiceFooter?: string;
  primaryColor?: string;
  sendEmailToBuyer: boolean;
  logoPresent: boolean;
}

export interface SettingsStatusItem {
  key: string;
  label: string;
  configured: boolean;
  description: string;
}

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  canIssue: boolean;
  /** Valores guardados por la API para retomar el asistente en otro dispositivo. */
  data?: Record<string, unknown>;
}
