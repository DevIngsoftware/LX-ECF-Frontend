import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { ROUTES } from '@/constants/routes';
import { AppShell } from './shell/AppShell';
import { UserMenu } from './shell/UserMenu';
import { DEVELOPER_NAV } from './navigation';

export function DeveloperLayout() {
  const { user } = useAuth();
  return (
    <AppShell
      groups={DEVELOPER_NAV}
      homeTo={ROUTES.developers.root}
      rootLabel="Desarrolladores"
      badge="Dev"
      chatContext="developer"
      sidebarFooter={
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Esta guía resume las rutas de integración. Consulta <Link to={ROUTES.developers.section('documentacion')} className="font-medium text-brand hover:underline">Documentación</Link> para ver ejemplos y abrir Swagger.
        </div>
      }
      headerActions={
        user ? (
          <>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to={user.portal === 'admin' ? ROUTES.admin.root : ROUTES.app.root}>Ir a mi portal</Link>
            </Button>
            <UserMenu />
          </>
        ) : (
          <Button asChild size="sm">
            <Link to={ROUTES.login}>Iniciar sesión</Link>
          </Button>
        )
      }
    />
  );
}
