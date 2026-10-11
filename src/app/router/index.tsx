import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FullPageLoader } from '@/components/shared/FullPageLoader';
import { LoadingState } from '@/components/shared/states';
import { GuestOnly, RequireAuth, RequireModule, RequirePermission } from '@/app/guards/guards';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { TenantLayout } from '@/app/layouts/TenantLayout';
import { DeveloperLayout } from '@/app/layouts/DeveloperLayout';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { ROUTES } from '@/constants/routes';
import type { ModuleKey, Permission } from '@/types/account';

function page<K extends string, P extends object>(loader: () => Promise<Record<K, ComponentType<P>>>, name: K) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const LandingPage = page(() => import('@/features/landing/pages/LandingPage'), 'LandingPage');
const LoginPage = page(() => import('@/features/auth/pages/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage');
const VerifyEmailPage = page(() => import('@/features/auth/pages/VerifyEmailPage'), 'VerifyEmailPage');
const ForgotPasswordPage = page(() => import('@/features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('@/features/auth/pages/ResetPasswordPage'), 'ResetPasswordPage');
const SessionExpiredPage = page(() => import('@/features/auth/pages/SessionExpiredPage'), 'SessionExpiredPage');
const AccessDeniedPage = page(() => import('@/features/auth/pages/AccessDeniedPage'), 'AccessDeniedPage');
const NotFoundPage = page(() => import('@/features/errors/pages/NotFoundPage'), 'NotFoundPage');

const OnboardingPage = page(() => import('@/features/onboarding/pages/OnboardingPage'), 'OnboardingPage');
const DashboardPage = page(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage');
const NewInvoicePage = page(() => import('@/features/invoices/pages/NewInvoicePage'), 'NewInvoicePage');
const InvoicesPage = page(() => import('@/features/invoices/pages/InvoicesPage'), 'InvoicesPage');
const InvoiceDetailPage = page(() => import('@/features/invoices/pages/InvoiceDetailPage'), 'InvoiceDetailPage');
const DgiiCenterPage = page(() => import('@/features/dgii/pages/DgiiCenterPage'), 'DgiiCenterPage');
const PartiesPage = page(() => import('@/features/parties/pages/PartiesPage'), 'PartiesPage');
const PartyDetailPage = page(() => import('@/features/parties/pages/PartyDetailPage'), 'PartyDetailPage');
const CatalogPage = page(() => import('@/features/catalog/pages/CatalogPage'), 'CatalogPage');
const ReceptionPage = page(() => import('@/features/reception/pages/ReceptionPage'), 'ReceptionPage');
const ReceivablesPage = page(() => import('@/features/receivables/pages/ReceivablesPage'), 'ReceivablesPage');
const ExpensesPage = page(() => import('@/features/expenses/pages/ExpensesPage'), 'ExpensesPage');
const ReportsPage = page(() => import('@/features/reports/pages/ReportsPage'), 'ReportsPage');
const ModulesPage = page(() => import('@/features/modules/pages/ModulesPage'), 'ModulesPage');
const IntegrationsPage = page(() => import('@/features/integrations/pages/IntegrationsPage'), 'IntegrationsPage');
const SubscriptionPage = page(() => import('@/features/subscription/pages/SubscriptionPage'), 'SubscriptionPage');
const NotificationsPage = page(() => import('@/features/notifications/pages/NotificationsPage'), 'NotificationsPage');
const UsersPage = page(() => import('@/features/users/pages/UsersPage'), 'UsersPage');
const SettingsPage = page(() => import('@/features/settings/pages/SettingsPage'), 'SettingsPage');

const DeveloperSectionPage = page(() => import('@/features/developers/pages/DeveloperSectionPage'), 'DeveloperSectionPage');

const AdminDashboardPage = page(() => import('@/features/admin/pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminCompaniesPage = page(() => import('@/features/admin/pages/AdminCompaniesPage'), 'AdminCompaniesPage');
const AdminCompanyDetailPage = page(() => import('@/features/admin/pages/AdminCompanyDetailPage'), 'AdminCompanyDetailPage');
const AdminPlansPage = page(() => import('@/features/admin/pages/AdminPlansPage'), 'AdminPlansPage');
const AdminSubscriptionsPage = page(() => import('@/features/admin/pages/AdminSubscriptionsPage'), 'AdminSubscriptionsPage');
const AdminUsersPage = page(() => import('@/features/admin/pages/AdminUsersPage'), 'AdminUsersPage');
const AdminSupportPage = page(() => import('@/features/admin/pages/AdminSupportPage'), 'AdminSupportPage');
const AdminSettingsPage = page(() => import('@/features/admin/pages/AdminSettingsPage'), 'AdminSettingsPage');
const AdminAuditPage = page(() => import('@/features/admin/pages/AdminAuditPage'), 'AdminAuditPage');

const full = (node: ReactNode) => <Suspense fallback={<FullPageLoader />}>{node}</Suspense>;
const inner = (node: ReactNode) => <Suspense fallback={<LoadingState rows={6} />}>{node}</Suspense>;
const perm = (permission: Permission, node: ReactNode) => inner(<RequirePermission permission={permission}>{node}</RequirePermission>);
const mod = (module: ModuleKey, node: ReactNode) => inner(<RequireModule module={module}>{node}</RequireModule>);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: ROUTES.home, element: full(<LandingPage />) }],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: ROUTES.login, element: inner(<LoginPage />) },
          { path: ROUTES.register, element: inner(<RegisterPage />) },
          { path: ROUTES.forgotPassword, element: inner(<ForgotPasswordPage />) },
          { path: ROUTES.resetPassword, element: inner(<ResetPasswordPage />) },
        ],
      },
      { path: ROUTES.verifyEmail, element: inner(<VerifyEmailPage />) },
      { path: ROUTES.sessionExpired, element: inner(<SessionExpiredPage />) },
      { path: ROUTES.accessDenied, element: inner(<AccessDeniedPage />) },
    ],
  },
  {
    element: <RequireAuth portal="tenant" />,
    children: [
      {
        path: ROUTES.app.root,
        element: <TenantLayout />,
        children: [
          { index: true, element: inner(<DashboardPage />) },
          { path: 'onboarding', element: perm('settings.manage', <OnboardingPage />) },
          { path: 'facturas/nueva', element: perm('invoices.emit', <NewInvoicePage />) },
          { path: 'comprobantes', element: perm('invoices.read', <InvoicesPage />) },
          { path: 'comprobantes/:id', element: perm('invoices.read', <InvoiceDetailPage />) },
          { path: 'dgii', element: perm('invoices.read', <DgiiCenterPage />) },
          { path: 'clientes', element: perm('parties.read', <PartiesPage kind="customers" />) },
          { path: 'clientes/:id', element: perm('parties.read', <PartyDetailPage kind="customers" />) },
          { path: 'proveedores', element: perm('parties.read', <PartiesPage kind="suppliers" />) },
          { path: 'proveedores/:id', element: perm('parties.read', <PartyDetailPage kind="suppliers" />) },
          { path: 'catalogo', element: mod('catalog', <CatalogPage />) },
          { path: 'recepcion', element: mod('reception', <ReceptionPage />) },
          { path: 'cuentas-por-cobrar', element: mod('receivables', <ReceivablesPage />) },
          { path: 'gastos', element: mod('expenses', <ExpensesPage />) },
          { path: 'reportes', element: perm('reports.read', <ReportsPage />) },
          { path: 'modulos', element: inner(<ModulesPage />) },
          { path: 'integraciones', element: perm('developers.manage', <IntegrationsPage />) },
          { path: 'suscripcion', element: perm('billing.manage', <SubscriptionPage />) },
          { path: 'notificaciones', element: inner(<NotificationsPage />) },
          { path: 'usuarios', element: perm('users.manage', <UsersPage />) },
          { path: 'configuracion', element: perm('settings.manage', <SettingsPage />) },
          { path: 'configuracion/:section', element: perm('settings.manage', <SettingsPage />) },
          { path: '*', element: inner(<NotFoundPage />) },
        ],
      },
    ],
  },
  {
    path: ROUTES.developers.root,
    element: <DeveloperLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.developers.section('introduccion')} replace /> },
      { path: ':slug', element: inner(<DeveloperSectionPage />) },
    ],
  },
  {
    element: <RequireAuth portal="admin" />,
    children: [
      {
        path: ROUTES.admin.root,
        element: <AdminLayout />,
        children: [
          { index: true, element: inner(<AdminDashboardPage />) },
          { path: 'empresas', element: perm('admin.companies', <AdminCompaniesPage />) },
          { path: 'empresas/:id', element: perm('admin.companies', <AdminCompanyDetailPage />) },
          { path: 'planes', element: perm('admin.plans', <AdminPlansPage />) },
          { path: 'suscripciones', element: perm('admin.plans', <AdminSubscriptionsPage />) },
          { path: 'usuarios', element: perm('admin.users', <AdminUsersPage />) },
          { path: 'soporte', element: inner(<AdminSupportPage />) },
          { path: 'notificaciones', element: inner(<NotificationsPage />) },
          { path: 'configuracion', element: inner(<AdminSettingsPage />) },
          { path: 'auditoria', element: perm('admin.audit', <AdminAuditPage />) },
          { path: '*', element: inner(<NotFoundPage />) },
        ],
      },
    ],
  },
  { path: '*', element: full(<NotFoundPage />) },
]);
