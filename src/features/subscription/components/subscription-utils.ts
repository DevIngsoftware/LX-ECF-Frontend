import type { StatusTone } from '@/constants/ecf';
import type { ModuleKey } from '@/types/account';

export const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVA: { label: 'Activa', tone: 'success' },
  PRUEBA: { label: 'Período de prueba', tone: 'info' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
  SUSPENDIDA: { label: 'Suspendida', tone: 'danger' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral' },
};

export const INVOICE_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  PAGADA: { label: 'Pagada', tone: 'success' },
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  reception: 'Recepción de e-CF',
  receivables: 'Cuentas por cobrar',
  catalog: 'Catálogo de productos',
  advanced_reports: 'Reportes avanzados',
  api: 'API comercial',
  expenses: 'Gestión de gastos',
};

export const ALL_MODULES = Object.keys(MODULE_LABELS) as ModuleKey[];

export type UsageTone = 'success' | 'warning' | 'danger';

export function usageTone(used: number, limit: number | null): UsageTone {
  if (limit === null || limit <= 0) return 'success';
  const ratio = used / limit;
  if (ratio >= 0.9) return 'danger';
  if (ratio >= 0.75) return 'warning';
  return 'success';
}

export const limitLabel = (limit: number | null, unit: string) => (limit === null ? `${unit} ilimitados` : `${limit} ${unit}`);
