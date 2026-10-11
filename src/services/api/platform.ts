import { ENV } from '@/constants/env';
import type { Page, PageQuery } from '@/types/common';
import type { Plan } from '@/types/account';
import type {
  AdminCompany, AdminDashboardOverview, AdminSubscription, ApiCredential, ApiLogEntry, ApiUsagePoint, AuditEvent, ChatMessage,
  CreatedCredential, InternalUser, PlatformSettings, SupportTicket,
} from '@/types/platform';
import { get, patch, post, put } from '../http/client';
import { ApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { adminCompanies, adminSubscriptions, auditEvents, credentials, internalUsers, plans, tickets } from '../mocks/data';
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
  users(): Promise<InternalUser[]>;
  saveUser(user: Omit<InternalUser, 'id'> & { id?: string }): Promise<InternalUser>;
  tickets(query: PageQuery & { status?: string }): Promise<Page<SupportTicket>>;
  updateTicket(id: string, status: string): Promise<void>;
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
    users: () => get(ENDPOINTS.admin.users),
    saveUser: (u) => (u.id ? put(`${ENDPOINTS.admin.users}/${u.id}`, u) : post(ENDPOINTS.admin.users, u)),
    tickets: (params) => get(ENDPOINTS.admin.tickets, { params }),
    updateTicket: (id, status) => patch(`${ENDPOINTS.admin.tickets}/${id}`, { status }),
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

let platformSettings: PlatformSettings = { platformName: 'LX e-CF', supportEmail: 'soporte@loadexpress.test', defaultTrialDays: 30, maintenanceMode: false, allowSelfSignup: true };

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
      return { credential, secret: `${prefix}_DEMO_${uid()}${uid()}_SIN_VALIDEZ` };
    },
    async revokeCredential(id) {
      await delay(500);
      const c = credentials.find((x) => x.id === id);
      if (c) c.status = 'REVOCADA';
    },
    async usage() {
      await delay(400);
      return Array.from({ length: 14 }, (_, i) => ({ date: daysAgo(13 - i), requests: 200 + Math.round(Math.sin(i / 2) * 80 + i * 22), errors: Math.round(4 + (i % 4) * 2) }));
    },
    async logs() {
      await delay(400);
      const paths = ['/v1/ecf (ilustrativo)', '/v1/ecf/{id}/estado (ilustrativo)', '/v1/ecf/{id}/pdf (ilustrativo)'];
      return Array.from({ length: 18 }, (_, i) => ({ id: `log${i}`, at: daysAgo(0, 23 - i), method: i % 3 ? 'GET' : 'POST', path: paths[i % 3], status: i % 7 === 0 ? 422 : i % 11 === 0 ? 401 : 200, latencyMs: 80 + ((i * 37) % 400) }));
    },
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
    async tickets(q) {
      await delay();
      return paginate(filterStatus(tickets, q.status), q, ['id', 'subject', 'company']);
    },
    async updateTicket(id, status) {
      await delay(400);
      const t = tickets.find((x) => x.id === id);
      if (t) {
        t.status = status;
        t.updatedAt = new Date().toISOString();
      }
    },
    async audit(q) {
      await delay();
      const list = q.category && q.category !== 'ALL' ? auditEvents.filter((a) => a.category === q.category) : auditEvents;
      return paginate(list, q, ['actor', 'action', 'target']);
    },
    async settings() {
      await delay(300);
      return platformSettings;
    },
    async saveSettings(s) {
      await delay(500);
      platformSettings = s;
      return s;
    },
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
export const developersService: DevelopersService = impl.developers;
export const adminService: AdminService = {
  ...impl.admin,
  dashboard: ENV.authUseMocks ? mock.admin.dashboard : http.admin.dashboard,
};
export const chatService: ChatService = ENV.chatApiPath ? http.chat : mock.chat;
