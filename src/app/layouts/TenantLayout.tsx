import { Link } from 'react-router-dom';
import { ArrowRight, Settings2 } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { ROUTES } from '@/constants/routes';
import { ENV } from '@/constants/env';
import { AppShell } from './shell/AppShell';
import { UserMenu } from './shell/UserMenu';
import { TENANT_NAV } from './navigation';

function OnboardingNotice() {
  const { user } = useAuth();
  if (!user?.tenant || user.tenant.onboardingComplete) return null;
  return (
    <div className="border-b bg-warning-soft px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Settings2 className="h-4 w-4 text-warning" aria-hidden />
        <span className="text-foreground">La configuración de tu empresa está incompleta. La emisión real se habilitará cuando el sistema confirme los requisitos.</span>
        <Link to={ROUTES.app.onboarding} className="inline-flex items-center gap-1 font-semibold text-warning hover:underline">
          Continuar configuración <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function IntegrationNotice() {
  if (ENV.authUseMocks || !ENV.useMocks) return null;
  return (
    <div className="border-b bg-muted/70 px-4 py-2 text-center text-xs text-muted-foreground sm:px-6">
      La cuenta, la configuración fiscal, los clientes, los comprobantes y el panel ya usan la API. Los demás módulos aún muestran datos de demostración.
    </div>
  );
}

function TenantCard() {
  const { user } = useAuth();
  if (!user?.tenant) return null;
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="truncate text-sm font-semibold">{user.tenant.name}</p>
      <p className="text-xs text-muted-foreground">RNC {user.tenant.rnc}</p>
    </div>
  );
}

export function TenantLayout() {
  return (
    <AppShell
      groups={TENANT_NAV}
      homeTo={ROUTES.app.root}
      rootLabel="Inicio"
      chatContext="tenant"
      sidebarFooter={<TenantCard />}
      topNotice={<><IntegrationNotice /><OnboardingNotice /></>}
      headerActions={
        <>
          <NotificationBell allTo={ROUTES.app.notifications} />
          <UserMenu settingsTo={ROUTES.app.settings} />
        </>
      }
    />
  );
}
