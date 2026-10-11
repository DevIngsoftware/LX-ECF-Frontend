import { BarChart3, Code2, Inbox, Package, Receipt, Wallet, type LucideIcon } from 'lucide-react';
import type { ModuleInfo, ModuleKey } from '@/types/account';
import type { StatusTone } from '@/constants/ecf';

export const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  reception: Inbox,
  receivables: Wallet,
  catalog: Package,
  advanced_reports: BarChart3,
  api: Code2,
  expenses: Receipt,
};

export type ModuleViewStatus = 'active' | 'available' | 'requested' | 'soon' | 'requires_plan';

export const MODULE_STATUS_META: Record<ModuleViewStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Activo', tone: 'success' },
  available: { label: 'Disponible', tone: 'info' },
  requested: { label: 'Solicitado', tone: 'warning' },
  soon: { label: 'Próximamente', tone: 'neutral' },
  requires_plan: { label: 'Requiere plan', tone: 'brand' },
};

/**
 * Traduce el estado del backend a un estado de interfaz. Un módulo disponible pero
 * no incluido en el plan vigente se presenta como "Requiere plan".
 */
export function viewStatus(m: ModuleInfo, planModules: ModuleKey[] | undefined): ModuleViewStatus {
  switch (m.status) {
    case 'ACTIVO':
      return 'active';
    case 'SOLICITADO':
      return 'requested';
    case 'PROXIMAMENTE':
      return 'soon';
    default:
      if (planModules && !planModules.includes(m.key)) return 'requires_plan';
      return 'available';
  }
}

export type ModuleFilter = 'all' | ModuleViewStatus;

export const MODULE_FILTERS: { value: ModuleFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'available', label: 'Disponibles' },
  { value: 'requires_plan', label: 'Requieren plan' },
  { value: 'requested', label: 'Solicitados' },
  { value: 'soon', label: 'Próximamente' },
];
