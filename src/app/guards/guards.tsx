import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { ROUTES } from '@/constants/routes';
import type { ModuleKey, Permission, Portal } from '@/types/account';
import { FullPageLoader } from '@/components/shared/FullPageLoader';
import { safeRedirect } from '@/features/auth/components/portal';
import { ModuleNotContracted } from '@/components/shared/states';
import { AccessDeniedState } from '@/components/shared/states';

/** La visibilidad en UI es solo orientativa: el backend valida cada operación. */
export function RequireAuth({ portal }: { portal: Portal }) {
  const { status, user, sessionExpired } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (!user) {
    return <Navigate to={sessionExpired ? ROUTES.sessionExpired : ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  if (user.portal !== portal) return <Navigate to={ROUTES.accessDenied} replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (user) {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={safeRedirect(from, user)} replace />;
  }
  return <Outlet />;
}

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? <>{children}</> : <AccessDeniedState />;
}

export function RequireModule({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { hasModule } = useAuth();
  return hasModule(module) ? <>{children}</> : <ModuleNotContracted module={module} />;
}
