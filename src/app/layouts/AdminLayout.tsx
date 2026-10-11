import { ShieldCheck } from 'lucide-react';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { ROUTES } from '@/constants/routes';
import { AppShell } from './shell/AppShell';
import { UserMenu } from './shell/UserMenu';
import { ADMIN_NAV } from './navigation';

export function AdminLayout() {
  return (
    <AppShell
      groups={ADMIN_NAV}
      homeTo={ROUTES.admin.root}
      rootLabel="Panel LX"
      badge="Admin"
      chatContext="admin"
      sidebarFooter={
        <div className="flex items-center gap-2 rounded-lg bg-ink p-3 text-xs text-white">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          Acceso exclusivo para personal autorizado de LoadExpress.
        </div>
      }
      headerActions={
        <>
          <NotificationBell allTo={ROUTES.admin.notifications} />
          <UserMenu settingsTo={ROUTES.admin.settings} />
        </>
      }
    />
  );
}
