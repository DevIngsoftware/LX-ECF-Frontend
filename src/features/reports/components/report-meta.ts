import { BarChart3, FileStack, Landmark, LineChart, PieChart, Receipt, Users, Wallet, type LucideIcon } from 'lucide-react';
import { DGII_STATUS_META, PAYMENT_STATUS_META } from '@/constants/ecf';
import type { ModuleKey } from '@/types/account';
import type { ReportKey } from '@/types/business';

export type ReportChartKind = 'bar' | 'area' | 'pie' | 'hbar';
export type ReportValueFormat = 'money' | 'count';

export interface ReportMeta {
  key: ReportKey;
  title: string;
  description: string;
  icon: LucideIcon;
  chart: ReportChartKind;
  valueFormat: ReportValueFormat;
  module?: ModuleKey;
}

export const REPORTS: ReportMeta[] = [
  { key: 'sales', title: 'Ventas', description: 'Facturación por período con ITBIS.', icon: BarChart3, chart: 'bar', valueFormat: 'money' },
  { key: 'types', title: 'Tipos de e-CF', description: 'Comprobantes emitidos por tipo.', icon: FileStack, chart: 'pie', valueFormat: 'count' },
  { key: 'taxes', title: 'Impuestos', description: 'ITBIS facturado, en gastos y retenido.', icon: Receipt, chart: 'hbar', valueFormat: 'money' },
  { key: 'customers', title: 'Clientes', description: 'Principales clientes por monto facturado.', icon: Users, chart: 'hbar', valueFormat: 'money' },
  { key: 'expenses', title: 'Gastos', description: 'Gastos agrupados por categoría.', icon: Wallet, chart: 'pie', valueFormat: 'money', module: 'expenses' },
  { key: 'receivables', title: 'Cuentas por cobrar', description: 'Saldos pendientes por estado de pago.', icon: PieChart, chart: 'bar', valueFormat: 'money', module: 'receivables' },
  { key: 'dgii', title: 'Estados DGII', description: 'Comprobantes por estado fiscal.', icon: Landmark, chart: 'pie', valueFormat: 'count' },
  { key: 'trends', title: 'Tendencias', description: 'Evolución de la facturación en el tiempo.', icon: LineChart, chart: 'area', valueFormat: 'money' },
];

export const REPORT_MAP = Object.fromEntries(REPORTS.map((r) => [r.key, r])) as Record<ReportKey, ReportMeta>;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Traduce valores técnicos (estados, períodos AAAA-MM) a etiquetas legibles. */
export function humanizeValue(key: ReportKey, column: string, value: string): string {
  if ((column === 'period' || column === 'label') && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-');
    return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
  }
  if (column === 'status' || column === 'label') {
    if (key === 'dgii') return DGII_STATUS_META[value]?.label ?? value;
    if (key === 'receivables') return PAYMENT_STATUS_META[value]?.label ?? value;
  }
  return value;
}

/** Columnas de conteo se muestran como número; el resto de columnas numéricas como RD$. */
export const isCountColumn = (column: string) => column === 'count' || column === 'cantidad';
