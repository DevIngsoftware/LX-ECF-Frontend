import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

/** Se muestra en las secciones de cuenta cuando no hay una sesión de empresa. */
export function SignInCard({ title, isAdmin }: { title: string; isAdmin?: boolean }) {
  const location = useLocation();
  return (
    <div className="surface mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center animate-fade-up">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Lock className="h-6 w-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Esta sección está disponible para cuentas de empresa. Las cuentas internas de LoadExpress no gestionan credenciales de API.'
            : 'Inicia sesión con tu cuenta de empresa para gestionar credenciales, consultar el consumo y revisar el historial de solicitudes.'}
        </p>
      </div>
      {!isAdmin && (
        <Button asChild>
          <Link to={ROUTES.login} state={{ from: location.pathname }}>
            Iniciar sesión
          </Link>
        </Button>
      )}
    </div>
  );
}
