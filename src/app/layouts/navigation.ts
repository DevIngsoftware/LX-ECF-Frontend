import {
  BarChart3, BookOpen, Boxes, Building2, CreditCard, FileCode2, FilePlus2, FileText, Gauge, Inbox, KeyRound, LayoutDashboard, LifeBuoy,
  Bell, Package, PlugZap, Receipt, ScrollText, Settings, ShieldCheck, Terminal, Truck, Users, Wallet, Layers, Rocket, AlertOctagon,
  History, Activity, Server, type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import type { ModuleKey, Permission } from '@/types/account';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  permission?: Permission;
  module?: ModuleKey;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const TENANT_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Inicio', to: ROUTES.app.root, icon: LayoutDashboard, end: true },
      { label: 'Nueva factura', to: ROUTES.app.newInvoice, icon: FilePlus2, permission: 'invoices.emit' },
      { label: 'Comprobantes', to: ROUTES.app.invoices, icon: FileText, permission: 'invoices.read' },
      { label: 'Centro DGII', to: ROUTES.app.dgii, icon: ShieldCheck, permission: 'invoices.read' },
      { label: 'Certificación DGII', to: ROUTES.app.certification, icon: ShieldCheck, permission: 'dgii.manage' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Clientes', to: ROUTES.app.customers, icon: Users, permission: 'parties.read' },
      { label: 'Proveedores', to: ROUTES.app.suppliers, icon: Truck, permission: 'parties.read' },
      { label: 'Catálogo', to: ROUTES.app.catalog, icon: Package, module: 'catalog' },
      { label: 'Recepción e-CF', to: ROUTES.app.reception, icon: Inbox, module: 'reception' },
      { label: 'Cuentas por cobrar', to: ROUTES.app.receivables, icon: Wallet, module: 'receivables' },
      { label: 'Gastos', to: ROUTES.app.expenses, icon: Receipt, module: 'expenses' },
      { label: 'Reportes', to: ROUTES.app.reports, icon: BarChart3, permission: 'reports.read' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { label: 'Módulos', to: ROUTES.app.modules, icon: Boxes },
      { label: 'Integraciones', to: ROUTES.app.integrations, icon: PlugZap, permission: 'developers.manage' },
      { label: 'Suscripción', to: ROUTES.app.subscription, icon: CreditCard, permission: 'billing.manage' },
      { label: 'Soporte', to: ROUTES.app.support, icon: LifeBuoy, permission: 'support.access' },
      { label: 'Usuarios', to: ROUTES.app.users, icon: Users, permission: 'users.manage' },
      { label: 'Configuración', to: ROUTES.app.settings, icon: Settings, permission: 'settings.manage' },
    ],
  },
];

export const DEVELOPER_SECTIONS = [
  { slug: 'introduccion', label: 'Introducción', icon: BookOpen, group: 'Comenzar' },
  { slug: 'primeros-pasos', label: 'Primeros pasos', icon: Rocket, group: 'Comenzar' },
  { slug: 'autenticacion', label: 'Autenticación', icon: KeyRound, group: 'Comenzar' },
  { slug: 'ambientes', label: 'Ambientes', icon: Server, group: 'Comenzar' },
  { slug: 'documentacion', label: 'Documentación', icon: FileCode2, group: 'Referencia' },
  { slug: 'ejemplos', label: 'Ejemplos de solicitudes', icon: Terminal, group: 'Referencia' },
  { slug: 'respuestas', label: 'Respuestas', icon: ScrollText, group: 'Referencia' },
  { slug: 'errores', label: 'Errores', icon: AlertOctagon, group: 'Referencia' },
  { slug: 'credenciales', label: 'Credenciales', icon: KeyRound, group: 'Mi cuenta' },
  { slug: 'consumo', label: 'Consumo', icon: Activity, group: 'Mi cuenta' },
  { slug: 'historial', label: 'Historial', icon: History, group: 'Mi cuenta' },
  { slug: 'soporte', label: 'Soporte', icon: LifeBuoy, group: 'Mi cuenta' },
] as const;

export type DeveloperSlug = (typeof DEVELOPER_SECTIONS)[number]['slug'];

export const DEVELOPER_NAV: NavGroup[] = ['Comenzar', 'Referencia', 'Mi cuenta'].map((group) => ({
  label: group,
  items: DEVELOPER_SECTIONS.filter((s) => s.group === group).map((s) => ({ label: s.label, to: ROUTES.developers.section(s.slug), icon: s.icon })),
}));

export const ADMIN_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard global', to: ROUTES.admin.root, icon: Gauge, end: true },
      { label: 'Empresas', to: ROUTES.admin.companies, icon: Building2, permission: 'admin.companies' },
      { label: 'Planes', to: ROUTES.admin.plans, icon: Layers, permission: 'admin.plans' },
      { label: 'Suscripciones', to: ROUTES.admin.subscriptions, icon: CreditCard, permission: 'admin.plans' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Usuarios internos', to: ROUTES.admin.users, icon: Users, permission: 'admin.users' },
      { label: 'Soporte', to: ROUTES.admin.support, icon: LifeBuoy, permission: 'admin.support' },
      { label: 'Notificaciones', to: ROUTES.admin.notifications, icon: Bell },
      { label: 'Auditoría', to: ROUTES.admin.audit, icon: ScrollText, permission: 'admin.audit' },
      { label: 'Configuración', to: ROUTES.admin.settings, icon: Settings, permission: 'admin.settings' },
    ],
  },
];
