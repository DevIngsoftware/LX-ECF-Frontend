import type { StatusTone } from '@/constants/ecf';

export const RECEPTION_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  RECIBIDO: { label: 'Recibido', tone: 'info' },
  EN_REVISION: { label: 'En revisión', tone: 'warning' },
  ACEPTADO: { label: 'Aceptado', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

export const receptionStatusMeta = (status: string) =>
  RECEPTION_STATUS[status] ?? { label: status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' '), tone: 'neutral' as const };
