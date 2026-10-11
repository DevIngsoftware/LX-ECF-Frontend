import { ENV } from '@/constants/env';
import type { AuthTokens, LoginInput, Permission, RegisterInput, SessionUser } from '@/types/account';
import { get, post } from '../http/client';
import { ApiError } from '../http/errors';
import { ENDPOINTS } from './endpoints';
import { delay } from '../mocks/utils';

export interface LoginResponse {
  user: SessionUser;
  tokens: AuthTokens;
}

export interface AuthService {
  login(input: LoginInput): Promise<LoginResponse>;
  refresh(): Promise<LoginResponse>;
  register(input: Omit<RegisterInput, 'acceptTerms'>): Promise<{ email: string; emailSent?: boolean }>;
  me(): Promise<SessionUser>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
}

const httpAuth: AuthService = {
  login: (input) => post<LoginResponse>(ENDPOINTS.auth.login, input),
  refresh: () => post<LoginResponse>(ENDPOINTS.auth.refresh),
  register: (input) => post(ENDPOINTS.auth.register, input),
  me: () => get<SessionUser>(ENDPOINTS.auth.me),
  logout: () => post(ENDPOINTS.auth.logout),
  forgotPassword: (email) => post(ENDPOINTS.auth.forgot, { email }),
  resetPassword: (token, password) => post(ENDPOINTS.auth.reset, { token, password }),
  verifyEmail: (token) => post(ENDPOINTS.auth.verifyEmail, { token }),
  resendVerification: (email) => post(`${ENDPOINTS.auth.verifyEmail}/reenviar`, { email }),
};

const tenantPermissions: Permission[] = [
  'invoices.read', 'invoices.emit', 'parties.read', 'parties.write', 'catalog.write', 'reports.read',
  'receivables.write', 'expenses.write', 'dgii.manage', 'users.manage', 'settings.manage', 'billing.manage', 'developers.manage',
];

export const DEMO_TENANT_USER: SessionUser = {
  id: 'u1',
  name: 'Usuario Demo',
  email: 'demo@ejemplo.test',
  portal: 'tenant',
  role: 'ADMIN',
  permissions: tenantPermissions,
  modules: ['catalog', 'receivables', 'api', 'reception', 'advanced_reports', 'expenses'],
  tenant: { name: 'Empresa Demostración, S.R.L.', rnc: '101000000', onboardingComplete: false, canIssue: false },
};

export const DEMO_ADMIN_USER: SessionUser = {
  id: 'iu1',
  name: 'Administrador LX (demo)',
  email: 'admin@loadexpress.test',
  portal: 'admin',
  role: 'SUPERADMIN',
  permissions: ['admin.access', 'admin.companies', 'admin.plans', 'admin.users', 'admin.audit'],
  modules: [],
};

const mockAuth: AuthService = {
  async login({ identifier, password }) {
    await delay(700);
    if (password.length < 4) throw new ApiError('unauthorized', 'Credenciales inválidas. Verifica tu correo y contraseña.', 401);
    const user = identifier.toLowerCase().includes('admin') ? DEMO_ADMIN_USER : DEMO_TENANT_USER;
    return { user, tokens: { accessToken: 'demo-token-sin-validez' } };
  },
  async register({ email }) {
    await delay(800);
    return { email };
  },
  async refresh() {
    throw new ApiError('unauthorized', 'Sin sesión', 401);
  },
  async me() {
    await delay(200);
    throw new ApiError('unauthorized', 'Sin sesión', 401);
  },
  logout: () => delay(150),
  forgotPassword: () => delay(700),
  async resetPassword(token) {
    await delay(700);
    if (!token) throw new ApiError('validation', 'El enlace de restablecimiento no es válido o ha expirado.', 400);
  },
  async verifyEmail(token) {
    await delay(700);
    if (!token) throw new ApiError('validation', 'El enlace de verificación no es válido o ha expirado.', 400);
  },
  resendVerification: () => delay(600),
};

export const authService: AuthService = ENV.authUseMocks ? mockAuth : httpAuth;
