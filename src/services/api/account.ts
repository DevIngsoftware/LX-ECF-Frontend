import { ENV } from '@/constants/env';
import type {
  AppNotification, CompanySettings, ModuleInfo, ModuleKey, OnboardingState, Plan, ServiceInvoice, SettingsStatusItem,
  Subscription, SubscriptionPayment, TenantUser, TenantUserInput,
} from '@/types/account';
import { get, getBlob, patch, post, put } from '../http/client';
import type { BankAccount, SupportTicketDetail } from '@/types/platform';
import { ApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { plans, serviceInvoices, tenantUsers } from '../mocks/data';
import { daysAgo, daysAhead, delay, uid } from '../mocks/utils';

export interface BillingService {
  subscription(): Promise<Subscription | null>;
  plans(): Promise<Plan[]>;
  invoices(): Promise<ServiceInvoice[]>;
  payments(): Promise<SubscriptionPayment[]>;
}

export interface ModulesService {
  list(): Promise<ModuleInfo[]>;
  request(key: ModuleKey): Promise<void>;
}

export interface NotificationsService {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface UsersService {
  list(): Promise<TenantUser[]>;
  create(input: TenantUserInput): Promise<TenantUser & { emailSent?: boolean }>;
  update(id: string, input: TenantUserInput): Promise<TenantUser>;
  setActive(id: string, active: boolean): Promise<void>;
  sendPasswordReset(id: string): Promise<void>;
}

export interface CertificateUpload {
  file: File;
  /** Se transmite una sola vez al backend y nunca se persiste en el navegador. */
  password: string;
}

export interface SettingsService {
  company(): Promise<CompanySettings>;
  updateCompany(input: CompanySettings): Promise<CompanySettings>;
  logo(): Promise<Blob>;
  uploadLogo(file: File): Promise<void>;
  status(): Promise<SettingsStatusItem[]>;
  uploadCertificate(input: CertificateUpload): Promise<void>;
  onboarding(): Promise<OnboardingState>;
  saveOnboardingStep(step: number, data: Record<string, unknown>): Promise<OnboardingState>;
}

const http = {
  billing: {
    subscription: () => get(ENDPOINTS.billing.subscription),
    plans: () => get(ENDPOINTS.billing.plans),
    invoices: () => get(ENDPOINTS.billing.invoices),
    payments: () => get(ENDPOINTS.billing.payments),
  } satisfies BillingService,
  modules: {
    list: () => get(ENDPOINTS.modules.list),
    request: (key) => post(ENDPOINTS.modules.request(key)),
  } satisfies ModulesService,
  notifications: {
    list: () => get(ENDPOINTS.notifications.list),
    markRead: (id) => patch(ENDPOINTS.notifications.read(id)),
    markAllRead: () => patch(ENDPOINTS.notifications.readAll),
  } satisfies NotificationsService,
  users: {
    list: () => get(ENDPOINTS.users),
    create: (input) => post(ENDPOINTS.users, input),
    update: (id, input) => put(`${ENDPOINTS.users}/${id}`, input),
    setActive: (id, active) => patch(`${ENDPOINTS.users}/${id}/estado`, { active }),
    sendPasswordReset: (id) => post(`${ENDPOINTS.users}/${id}/restablecer-acceso`),
  } satisfies UsersService,
  settings: {
    company: () => get(ENDPOINTS.settings.company),
    updateCompany: (input) => put(ENDPOINTS.settings.company, input),
    logo: () => getBlob(ENDPOINTS.settings.logo),
    uploadLogo: (file) => {
      const form = new FormData();
      form.append('logo', file);
      return post<void>(ENDPOINTS.settings.uploadLogo, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    status: () => get(ENDPOINTS.settings.status),
    uploadCertificate: ({ file, password }) => {
      const form = new FormData();
      form.append('certificado', file);
      form.append('password', password);
      return post(ENDPOINTS.dgii.certificate, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onboarding: () => get(ENDPOINTS.onboarding),
    saveOnboardingStep: (step, data) => put(`${ENDPOINTS.onboarding}/pasos/${step}`, data),
  } satisfies SettingsService,
};

let companySettings: CompanySettings = {
  legalName: 'Empresa Demostración, S.R.L.',
  tradeName: 'Empresa Demo',
  rnc: '101000000',
  email: 'facturacion@ejemplo.test',
  phone: '809-555-0000',
  address: 'Dirección de demostración, Santo Domingo',
  economicActivity: 'Servicios de tecnología (demo)',
  defaultPaymentTermDays: 30,
  defaultItbisRate: 18,
  invoiceFooter: 'Gracias por preferirnos.',
  primaryColor: '#E60012',
  sendEmailToBuyer: true,
  logoPresent: false,
};

const onboardingState: OnboardingState = { currentStep: 0, completedSteps: [], canIssue: false };
let mockLogo: Blob | null = null;

const mock = {
  billing: {
    async subscription() {
      await delay();
      return { planId: 'plan-empresarial', planName: 'Empresarial', status: 'PRUEBA', startedAt: daysAgo(20), renewalDate: daysAhead(10), documentsUsed: 64, documentsLimit: 500, usersUsed: 4, usersLimit: 10, modules: ['catalog', 'receivables', 'api'] };
    },
    async plans() {
      await delay(300);
      return plans;
    },
    async invoices() {
      await delay(300);
      return serviceInvoices;
    },
    async payments() {
      await delay(300);
      return [];
    },
  } satisfies BillingService,
  users: {
    async list() {
      await delay();
      return [...tenantUsers];
    },
    async create(input) {
      await delay(600);
      if (tenantUsers.some((u) => u.email === input.email)) throw new ApiError('conflict', 'Ya existe un usuario con ese correo.', 409);
      const u = { ...input, id: uid() };
      tenantUsers.push(u);
      return u;
    },
    async update(id, input) {
      await delay(500);
      const idx = tenantUsers.findIndex((u) => u.id === id);
      tenantUsers[idx] = { ...tenantUsers[idx], ...input };
      return tenantUsers[idx];
    },
    async setActive(id, active) {
      await delay(300);
      const u = tenantUsers.find((x) => x.id === id);
      if (u) u.active = active;
    },
    sendPasswordReset: () => delay(600),
  } satisfies UsersService,
  settings: {
    async company() {
      await delay();
      return companySettings;
    },
    async updateCompany(input) {
      await delay(600);
      companySettings = { ...input, logoPresent: !!mockLogo || input.logoPresent };
      return companySettings;
    },
    async logo() {
      await delay();
      if (!mockLogo) throw new ApiError('not_found', 'La empresa no tiene logo.', 404);
      return mockLogo;
    },
    async uploadLogo(file) {
      await delay(300);
      mockLogo = file;
      companySettings = { ...companySettings, logoPresent: true };
    },
    async status() {
      await delay(300);
      return [
        { key: 'company', label: 'Datos de empresa', configured: true, description: 'Información general completa.' },
        { key: 'fiscal', label: 'Información fiscal', configured: true, description: 'RNC y actividad económica registrados.' },
        { key: 'certificate', label: 'Certificado digital', configured: false, description: 'Carga tu certificado .p12 para firmar comprobantes.' },
        { key: 'sequences', label: 'Secuencias electrónicas', configured: false, description: 'Registra las secuencias autorizadas por la DGII.' },
        { key: 'preferences', label: 'Preferencias de facturación', configured: true, description: 'Condiciones por defecto definidas.' },
        { key: 'templates', label: 'Plantillas de documentos', configured: false, description: 'Personaliza la representación impresa.' },
      ];
    },
    async uploadCertificate({ file }) {
      await delay(1200);
      if (!file.name.toLowerCase().endsWith('.p12') && !file.name.toLowerCase().endsWith('.pfx')) {
        throw new ApiError('validation', 'El archivo debe ser un certificado .p12 o .pfx.', 400);
      }
      throw new ApiError('server', 'Modo demostración: el certificado no se envió. La carga real requiere conexión con el backend LX e-CF.', 503);
    },
    async onboarding() {
      await delay(300);
      return { ...onboardingState };
    },
    async saveOnboardingStep(step) {
      await delay(500);
      if (!onboardingState.completedSteps.includes(step)) onboardingState.completedSteps.push(step);
      onboardingState.currentStep = step + 1;
      return { ...onboardingState };
    },
  } satisfies SettingsService,
};

const impl = ENV.useMocks ? mock : http;
export const billingService: BillingService = {
  ...impl.billing,
  subscription: ENV.authUseMocks ? mock.billing.subscription : http.billing.subscription,
  plans: ENV.authUseMocks ? mock.billing.plans : http.billing.plans,
  invoices: ENV.authUseMocks ? mock.billing.invoices : http.billing.invoices,
  payments: ENV.authUseMocks ? mock.billing.payments : http.billing.payments,
};
export const modulesService: ModulesService = http.modules;
export const notificationsService: NotificationsService = http.notifications;
export const usersService: UsersService = ENV.authUseMocks ? mock.users : http.users;
export const settingsService: SettingsService = ENV.settingsUseMocks ? mock.settings : http.settings;

export interface DepositInput {
  kind: 'PLAN' | 'MODULE';
  planId?: string;
  moduleKey?: ModuleKey;
  bankAccountId: string;
  amount: number;
  reference?: string;
  proof: File;
  existingTicketId?: string;
}

export const manualPaymentsService = {
  accounts: () => get<BankAccount[]>('/cuentas-bancarias'),
  submit: (input: DepositInput) => {
    const form = new FormData();
    form.append('kind', input.kind);
    if (input.planId) form.append('planId', input.planId);
    if (input.moduleKey) form.append('moduleKey', input.moduleKey);
    form.append('bankAccountId', input.bankAccountId);
    form.append('amount', String(input.amount));
    if (input.reference) form.append('reference', input.reference);
    if (input.existingTicketId) form.append('existingTicketId', input.existingTicketId);
    form.append('proof', input.proof);
    return post<SupportTicketDetail>('/pagos-manuales/solicitudes', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
