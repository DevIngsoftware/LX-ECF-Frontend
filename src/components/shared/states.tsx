import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, CloudOff, Inbox, Lock, PackagePlus, ServerCrash, Settings2, ShieldAlert, WifiOff, type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { toApiError } from '@/services/http/errors';
import type { ModuleKey } from '@/types/account';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'danger' | 'warning' | 'success' | 'info' | 'brand';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  danger: 'bg-destructive-soft text-destructive',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand',
};

interface StateViewProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function StateView({ icon: Icon, title, description, tone = 'neutral', action, className, compact }: StateViewProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center animate-fade-up', compact ? 'gap-2 py-8' : 'gap-4 py-16', className)} role="status">
      <div className={cn('flex items-center justify-center rounded-2xl', compact ? 'h-10 w-10' : 'h-14 w-14', toneClasses[tone])}>
        <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className={cn('font-semibold', compact ? 'text-sm' : 'text-lg')}>{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title = 'Sin datos', description = 'Aún no hay información para mostrar.', action, icon = Inbox, compact }: Partial<StateViewProps>) {
  return <StateView icon={icon} title={title} description={description} action={action} compact={compact} />;
}

export function LoadingState({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateView icon={WifiOff} tone="warning" title="Sin conexión" description="No pudimos conectar con el servidor. Verifica tu conexión a internet." action={onRetry && <Button variant="outline" onClick={onRetry}>Reintentar</Button>} />
  );
}

export function ServiceUnavailableState({ description, onRetry }: { description?: string; onRetry?: () => void }) {
  return (
    <StateView icon={ServerCrash} tone="danger" title="Servicio no disponible" description={description ?? 'El servicio no está disponible en este momento. Inténtalo más tarde.'} action={onRetry && <Button variant="outline" onClick={onRetry}>Reintentar</Button>} />
  );
}

export function AccessDeniedState() {
  return <StateView icon={Lock} tone="danger" title="Acceso denegado" description="Tu rol no tiene permisos para esta sección. Contacta al administrador de tu empresa." />;
}

const MODULE_NAMES: Record<ModuleKey, string> = {
  reception: 'Recepción de e-CF',
  receivables: 'Cuentas por cobrar',
  catalog: 'Catálogo de productos y servicios',
  advanced_reports: 'Reportes avanzados',
  api: 'API comercial',
  expenses: 'Gestión de gastos',
};

export function ModuleNotContracted({ module }: { module: ModuleKey }) {
  return (
    <StateView
      icon={PackagePlus}
      tone="brand"
      title={`${MODULE_NAMES[module]} no está contratado`}
      description="Esta funcionalidad no forma parte de tu plan actual. Puedes solicitar su activación desde el catálogo de módulos."
      action={<Button asChild><Link to={ROUTES.app.modules}>Ver módulos disponibles</Link></Button>}
    />
  );
}

export function SubscriptionInactiveState() {
  return (
    <StateView icon={ShieldAlert} tone="warning" title="Suscripción inactiva" description="Tu suscripción no está activa. Renueva o actualiza tu plan para continuar." action={<Button asChild><Link to={ROUTES.app.subscription}>Ver suscripción</Link></Button>} />
  );
}

export function ConfigIncompleteState({ description }: { description?: string }) {
  return (
    <StateView icon={Settings2} tone="warning" title="Configuración incompleta" description={description ?? 'Completa la configuración de tu empresa antes de continuar.'} action={<Button asChild><Link to={ROUTES.app.onboarding}>Continuar configuración</Link></Button>} />
  );
}

export function SuccessState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return <StateView icon={CheckCircle2} tone="success" title={title} description={description} action={action} />;
}

export function PendingState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return <StateView icon={Clock} tone="info" title={title} description={description} action={action} />;
}

/** Traduce el error del backend al estado más útil para el usuario. */
export function ErrorState({ error, onRetry, compact }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const e = toApiError(error);
  switch (e.kind) {
    case 'network':
      return <OfflineState onRetry={onRetry} />;
    case 'forbidden':
      return <AccessDeniedState />;
    case 'subscription_inactive':
      return <SubscriptionInactiveState />;
    case 'server':
      return <ServiceUnavailableState description={e.message} onRetry={onRetry} />;
    case 'timeout':
      return <StateView icon={CloudOff} tone="warning" title="Tiempo de espera agotado" description={e.message} compact={compact} action={onRetry && <Button variant="outline" onClick={onRetry}>Reintentar</Button>} />;
    default:
      return <StateView icon={AlertTriangle} tone="danger" title="No se pudo cargar la información" description={e.message} compact={compact} action={onRetry && <Button variant="outline" onClick={onRetry}>Reintentar</Button>} />;
  }
}
