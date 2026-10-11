import { Badge } from '@/components/ui/badge';
import { DGII_STATUS_META, INTERNAL_STATUS_META, PAYMENT_STATUS_META, type StatusTone } from '@/constants/ecf';
import { cn } from '@/lib/utils';

const dot: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground',
  brand: 'bg-brand',
};

export function StatusBadge({ label, tone, className }: { label: string; tone: StatusTone; className?: string }) {
  return (
    <Badge variant={tone} className={cn('font-medium', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot[tone])} aria-hidden />
      {label}
    </Badge>
  );
}

const humanize = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

export function InternalStatusBadge({ status }: { status: string }) {
  const meta = INTERNAL_STATUS_META[status] ?? { label: humanize(status), tone: 'neutral' as const };
  return <StatusBadge {...meta} />;
}

export function DgiiStatusBadge({ status }: { status?: string }) {
  const key = status ?? 'NO_ENVIADO';
  const meta = DGII_STATUS_META[key] ?? { label: humanize(key), tone: 'neutral' as const };
  return <StatusBadge {...meta} />;
}

export function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const meta = PAYMENT_STATUS_META[status] ?? { label: humanize(status), tone: 'neutral' as const };
  return <StatusBadge {...meta} />;
}

const GENERIC: Record<string, StatusTone> = {
  ACTIVO: 'success', ACTIVA: 'success', ACEPTADO: 'success', RESUELTO: 'success', PAGADA: 'success',
  PRUEBA: 'info', RECIBIDO: 'info', EN_PROGRESO: 'info', SOLICITADO: 'info', ONBOARDING: 'info', DISPONIBLE: 'neutral',
  PENDIENTE: 'warning', EN_REVISION: 'warning', ABIERTO: 'warning', MEDIA: 'warning', ALTA: 'danger',
  SUSPENDIDA: 'danger', VENCIDA: 'danger', RECHAZADO: 'danger', REVOCADA: 'danger', CRITICA: 'danger', CANCELADA: 'danger',
  CERRADO: 'neutral', BAJA: 'neutral', PROXIMAMENTE: 'neutral', INACTIVO: 'neutral',
};

export function GenericStatusBadge({ status }: { status: string }) {
  return <StatusBadge label={humanize(status)} tone={GENERIC[status] ?? 'neutral'} />;
}
