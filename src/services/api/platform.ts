import { ENV } from '@/constants/env';
import type { Page, PageQuery } from '@/types/common';
import type { Plan } from '@/types/account';
import type {
  AdminCompany, AdminDashboardOverview, AdminSubscription, ApiCredential, ApiLogEntry, ApiUsagePoint, AuditEvent, ChatMessage,
  BankAccount, CreatedCredential, InternalUser, PlatformSettings, SupportTicket, SupportTicketDetail,
} from '@/types/platform';
import { get, getBlob, patch, post, put } from '../http/client';
import { ApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { adminCompanies, adminSubscriptions, credentials, internalUsers, plans } from '../mocks/data';
import { daysAgo, delay, paginate, uid } from '../mocks/utils';

export interface DevelopersService {
  credentials(): Promise<ApiCredential[]>;
  createCredential(name: string, environment: ApiCredential['environment']): Promise<CreatedCredential>;
  revokeCredential(id: string): Promise<void>;
  usage(): Promise<ApiUsagePoint[]>;
  logs(): Promise<ApiLogEntry[]>;
}

export interface AdminService {
  dashboard(): Promise<AdminDashboardOverview>;
  companies(query: PageQuery & { status?: string }): Promise<Page<AdminCompany>>;
  company(id: string): Promise<AdminCompany>;
  setCompanyStatus(id: string, status: string): Promise<void>;
  plans(): Promise<Plan[]>;
  savePlan(plan: Plan): Promise<Plan>;
  subscriptions(query: PageQuery & { status?: string }): Promise<Page<AdminSubscription>>;
  setSubscriptionStatus(id: string, status: string): Promise<void>;
  users(): Promise<InternalUser[]>;
  saveUser(user: Omit<InternalUser, 'id'> & { id?: string }): Promise<InternalUser>;
  resendInvitation(id: string): Promise<void>;
  resendEmailChangeVerification(id: string): Promise<void>;
  tickets(query: PageQuery & { status?: string; priority?: string }): Promise<Page<SupportTicket>>;
  ticket(id: string): Promise<SupportTicketDetail>;
  updateTicket(id: string, status: string): Promise<SupportTicketDetail>;
  replyTicket(id: string, body: string): Promise<SupportTicketDetail>;
  approveModuleRequest(ticketId: string): Promise<SupportTicketDetail>;
  approveDeposit(ticketId: string): Promise<SupportTicketDetail>;
  rejectDeposit(ticketId: string, reason: string): Promise<SupportTicketDetail>;
  depositProof(ticketId: string): Promise<Blob>;
  bankAccounts(): Promise<BankAccount[]>;
  saveBankAccounts(accounts: BankAccount[]): Promise<BankAccount[]>;
  audit(query: PageQuery & { category?: string }): Promise<Page<AuditEvent>>;
  settings(): Promise<PlatformSettings>;
  saveSettings(s: PlatformSettings): Promise<PlatformSettings>;
}

export interface ChatService {
  readonly available: boolean;
  send(history: ChatMessage[], signal?: AbortSignal): Promise<string>;
}

const http = {
  developers: {
    credentials: () => get(ENDPOINTS.developers.credentials),
    createCredential: (name, environment) => post(ENDPOINTS.developers.credentials, { name, environment }),
    revokeCredential: (id) => patch(`${ENDPOINTS.developers.credentials}/${id}/revocar`),
    usage: () => get(ENDPOINTS.developers.usage),
    logs: () => get(ENDPOINTS.developers.logs),
  } satisfies DevelopersService,
  admin: {
    dashboard: () => get(ENDPOINTS.admin.dashboard),
    companies: (params) => get(ENDPOINTS.admin.companies, { params }),
    company: (id) => get(`${ENDPOINTS.admin.companies}/${id}`),
    setCompanyStatus: (id, status) => patch(`${ENDPOINTS.admin.companies}/${id}/estado`, { status }),
    plans: () => get(ENDPOINTS.admin.plans),
    savePlan: (plan) => (plan.id ? put(`${ENDPOINTS.admin.plans}/${plan.id}`, plan) : post(ENDPOINTS.admin.plans, plan)),
    subscriptions: (params) => get(ENDPOINTS.admin.subscriptions, { params }),
    setSubscriptionStatus: (id, status) => patch(`${ENDPOINTS.admin.subscriptions}/${id}/estado`, { status }),
    users: () => get(ENDPOINTS.admin.users),
    saveUser: (u) => (u.id ? put(`${ENDPOINTS.admin.users}/${u.id}`, u) : post(ENDPOINTS.admin.users, u)),
    resendInvitation: (id) => post(`${ENDPOINTS.admin.users}/${id}/reenviar-invitacion`),
    resendEmailChangeVerification: (id) => post(`${ENDPOINTS.admin.users}/${id}/reenviar-verificacion`),
    tickets: (params) => get(ENDPOINTS.admin.tickets, { params }),
    ticket: (id) => get(`${ENDPOINTS.admin.tickets}/${id}`),
    updateTicket: (id, status) => patch(`${ENDPOINTS.admin.tickets}/${id}`, { status }),
    replyTicket: (id, body) => post(`${ENDPOINTS.admin.tickets}/${id}/mensajes`, { body }),
    approveModuleRequest: (ticketId) => post(`/admin/modulos/solicitudes/${ticketId}/aprobar`),
    approveDeposit: (ticketId) => post(`/admin/soporte/${ticketId}/validar-deposito`),
    rejectDeposit: (ticketId, reason) => post(`/admin/soporte/${ticketId}/rechazar-deposito`, { reason }),
    depositProof: (ticketId) => getBlob(`/admin/soporte/${ticketId}/comprobante`),
    bankAccounts: () => get('/admin/cuentas-bancarias'),
    saveBankAccounts: (accounts) => put('/admin/cuentas-bancarias', accounts),
    audit: (params) => get(ENDPOINTS.admin.audit, { params }),
    settings: () => get(ENDPOINTS.admin.settings),
    saveSettings: (s) => put(ENDPOINTS.admin.settings, s),
  } satisfies AdminService,
  chat: {
    available: ENV.chatApiPath !== '',
    send: (history, signal) =>
      post<{ reply: string }>(ENV.chatApiPath, { messages: history.map(({ role, content }) => ({ role, content })) }, { signal }).then((r) => r.reply),
  } satisfies ChatService,
};

const filterStatus = <T extends { status: string }>(list: T[], status?: string) => (status && status !== 'ALL' ? list.filter((x) => x.status === status) : list);

const mock = {
  developers: {
    async credentials() {
      await delay();
      return [...credentials];
    },
    async createCredential(name, environment) {
      await delay(800);
      const prefix = `lx_${environment === 'sandbox' ? 'test' : 'live'}_${uid().slice(0, 4)}`;
      const credential: ApiCredential = { id: uid(), name, prefix, environment, createdAt: new Date().toISOString(), status: 'ACTIVA' };
      credentials.unshift(credential);
      return { credential, apiKey: `${prefix}_DEMO_KEY`, secret: `${prefix}_DEMO_${uid()}${uid()}_SIN_VALIDEZ` };
    },
    async revokeCredential(id) {
      await delay(500);
      const c = credentials.find((x) => x.id === id);
      if (c) c.status = 'REVOCADA';
    },
    usage: () => http.developers.usage(),
    logs: () => http.developers.logs(),
  } satisfies DevelopersService,
  admin: {
    async dashboard() {
      await delay();
      return {
        companies: adminCompanies.length,
        configuredCompanies: adminCompanies.filter((c) => c.status === 'ACTIVA').length,
        documentsThisMonth: adminCompanies.reduce((s, c) => s + c.documentsThisMonth, 0),
        trend: Array.from({ length: 12 }, (_, i) => ({ date: daysAgo((11 - i) * 30), documents: 4000 + i * 900 + Math.round(Math.sin(i) * 700) })),
      };
    },
    async companies(q) {
      await delay();
      return paginate(filterStatus(adminCompanies, q.status), q, ['name', 'rnc', 'plan']);
    },
    async company(id) {
      await delay(300);
      const c = adminCompanies.find((x) => x.id === id);
      if (!c) throw new ApiError('not_found', 'La empresa no existe.', 404);
      return c;
    },
    async setCompanyStatus(id, status) {
      await delay(500);
      const c = adminCompanies.find((x) => x.id === id);
      if (c) c.status = status;
    },
    async plans() {
      await delay(300);
      return [...plans];
    },
    async savePlan(plan) {
      await delay(600);
      const idx = plans.findIndex((p) => p.id === plan.id);
      if (idx >= 0) plans[idx] = plan;
      else plans.push({ ...plan, id: uid() });
      return plan;
    },
    async subscriptions(q) {
      await delay();
      return paginate(filterStatus(adminSubscriptions, q.status), q, ['company', 'plan']);
    },
    async setSubscriptionStatus(id, status) {
      await delay(400);
      const subscription = adminSubscriptions.find((item) => item.id === id);
      if (subscription) subscription.status = status;
    },
    async users() {
      await delay();
      return [...internalUsers];
    },
    async saveUser(u) {
      await delay(500);
      if (u.id) {
        const idx = internalUsers.findIndex((x) => x.id === u.id);
        internalUsers[idx] = { ...internalUsers[idx], ...u, id: u.id };
        return internalUsers[idx];
      }
      const created = { ...u, id: uid() };
      internalUsers.push(created);
      return created;
    },
    resendInvitation: () => delay(500),
    resendEmailChangeVerification: () => delay(500),
    tickets: (params) => http.admin.tickets(params),
    ticket: (id) => http.admin.ticket(id),
    updateTicket: (id, status) => http.admin.updateTicket(id, status),
    replyTicket: (id, body) => http.admin.replyTicket(id, body),
    approveModuleRequest: (ticketId) => http.admin.approveModuleRequest(ticketId),
    approveDeposit: (ticketId) => http.admin.approveDeposit(ticketId),
    rejectDeposit: (ticketId, reason) => http.admin.rejectDeposit(ticketId, reason),
    depositProof: (ticketId) => http.admin.depositProof(ticketId),
    bankAccounts: () => http.admin.bankAccounts(),
    saveBankAccounts: (accounts) => http.admin.saveBankAccounts(accounts),
    audit: (params) => http.admin.audit(params),
    settings: () => http.admin.settings(),
    saveSettings: (s) => http.admin.saveSettings(s),
  } satisfies AdminService,
  chat: {
    available: false,
    async send() {
      await delay(900);
      throw new ApiError('server', 'El servicio de inteligencia artificial aún no está conectado. Esta es una vista previa de la interfaz del asistente.', 503);
    },
  } satisfies ChatService,
};

const impl = ENV.useMocks ? mock : http;
export const developersService: DevelopersService = {
  ...impl.developers,
  credentials: ENV.authUseMocks ? mock.developers.credentials : http.developers.credentials,
  createCredential: ENV.authUseMocks ? mock.developers.createCredential : http.developers.createCredential,
  revokeCredential: ENV.authUseMocks ? mock.developers.revokeCredential : http.developers.revokeCredential,
  usage: http.developers.usage,
  logs: http.developers.logs,
};
export const adminService: AdminService = {
  ...impl.admin,
  dashboard: ENV.authUseMocks ? mock.admin.dashboard : http.admin.dashboard,
  companies: ENV.authUseMocks ? mock.admin.companies : http.admin.companies,
  company: ENV.authUseMocks ? mock.admin.company : http.admin.company,
  setCompanyStatus: ENV.authUseMocks ? mock.admin.setCompanyStatus : http.admin.setCompanyStatus,
  plans: ENV.authUseMocks ? mock.admin.plans : http.admin.plans,
  savePlan: ENV.authUseMocks ? mock.admin.savePlan : http.admin.savePlan,
  subscriptions: ENV.authUseMocks ? mock.admin.subscriptions : http.admin.subscriptions,
  setSubscriptionStatus: ENV.authUseMocks ? mock.admin.setSubscriptionStatus : http.admin.setSubscriptionStatus,
  users: ENV.authUseMocks ? mock.admin.users : http.admin.users,
  saveUser: ENV.authUseMocks ? mock.admin.saveUser : http.admin.saveUser,
  resendInvitation: ENV.authUseMocks ? mock.admin.resendInvitation : http.admin.resendInvitation,
  resendEmailChangeVerification: ENV.authUseMocks ? mock.admin.resendEmailChangeVerification : http.admin.resendEmailChangeVerification,
  tickets: http.admin.tickets,
  ticket: http.admin.ticket,
  updateTicket: http.admin.updateTicket,
  replyTicket: http.admin.replyTicket,
  approveModuleRequest: http.admin.approveModuleRequest,
  approveDeposit: http.admin.approveDeposit,
  rejectDeposit: http.admin.rejectDeposit,
  depositProof: http.admin.depositProof,
  bankAccounts: http.admin.bankAccounts,
  saveBankAccounts: http.admin.saveBankAccounts,
  audit: http.admin.audit,
  settings: http.admin.settings,
  saveSettings: http.admin.saveSettings,
};

export const supportService = {
  tickets: () => get<Page<SupportTicket>>('/soporte'),
  ticket: (id: string) => get<SupportTicketDetail>(`/soporte/${id}`),
  create: (subject: string, priority: string, body: string) =>
    post<SupportTicketDetail>('/soporte', { subject, priority, body }),
  reply: (id: string, body: string) => post<SupportTicketDetail>(`/soporte/${id}/mensajes`, { body }),
  depositProof: (id: string) => getBlob(`/soporte/${id}/comprobante`),
};
export const chatService: ChatService = ENV.chatApiPath ? http.chat : mock.chat;
