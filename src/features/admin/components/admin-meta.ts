import type { AdminRole, ModuleKey } from '@/types/account';

export const MODULE_LABELS: Record<ModuleKey, string> = {
  reception: 'Recepción de e-CF',
  receivables: 'Cuentas por cobrar',
  catalog: 'Catálogo',
  advanced_reports: 'Reportes avanzados',
  api: 'API comercial',
  expenses: 'Gastos',
};

export const MODULE_KEYS = Object.keys(MODULE_LABELS) as ModuleKey[];

export const COMPANY_STATUSES = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PRUEBA', label: 'En prueba' },
  { value: 'ONBOARDING', label: 'En configuración' },
  { value: 'SUSPENDIDA', label: 'Suspendida' },
];

export const SUBSCRIPTION_STATUSES = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PRUEBA', label: 'En prueba' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'SUSPENDIDA', label: 'Suspendida' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const TICKET_STATUSES = [
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'RESUELTO', label: 'Resuelto' },
  { value: 'CERRADO', label: 'Cerrado' },
];

export const TICKET_PRIORITIES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

export const AUDIT_CATEGORIES = [
  { value: 'ACCESO', label: 'Acceso' },
  { value: 'CAMBIO', label: 'Cambio' },
  { value: 'EVENTO', label: 'Evento' },
];

export const ADMIN_ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: 'SUPERADMIN', label: 'Superadministrador', description: 'Acceso total a la plataforma.' },
  { value: 'SOPORTE', label: 'Soporte', description: 'Atiende tickets y consulta empresas.' },
  { value: 'COMERCIAL', label: 'Comercial', description: 'Gestiona planes, empresas y suscripciones.' },
  { value: 'FINANZAS', label: 'Finanzas', description: 'Consulta suscripciones y cobros.' },
];

export const roleLabel = (r: string) => ADMIN_ROLES.find((x) => x.value === r)?.label ?? r;

export const labelOf = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? v;

/** Los montos en 0 o ausentes no se presentan como precio real. */
export const priceText = (label: string | null | undefined) => (label && label.trim() ? label : 'Consultar');
