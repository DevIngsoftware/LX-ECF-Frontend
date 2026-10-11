import type { DatePreset, DateRange } from '@/types/common';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function rangeFromPreset(preset: Exclude<DatePreset, 'custom'>): DateRange {
  const now = new Date();
  const to = endOfDay(now).toISOString();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to };
    case '7d':
      return { from: startOfDay(new Date(now.getTime() - 6 * 86400000)).toISOString(), to };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
  }
}

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoy',
  '7d': 'Últimos 7 días',
  month: 'Mes actual',
  year: 'Año actual',
  custom: 'Personalizado',
};

export const toInputDate = (iso: string) => iso.slice(0, 10);
export const fromInputDate = (value: string, end = false) => (end ? endOfDay(new Date(`${value}T00:00:00`)) : new Date(`${value}T00:00:00`)).toISOString();
