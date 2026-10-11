import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { ROUTES } from '@/constants/routes';
import { AuthHeader } from '../components/AuthHeader';
import { portalRoot } from '../components/portal';

export function AccessDeniedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <AuthHeader
        center
        icon={ShieldX}
        tone="danger"
        title="Acceso denegado"
        description={
          user
            ? 'Tu cuenta no tiene acceso a esta sección. Si crees que se trata de un error, contacta al administrador de tu empresa.'
            : 'Necesitas iniciar sesión con una cuenta autorizada para acceder a esta sección.'
        }
      />
      <div className="space-y-3">
        {user ? (
          <Button asChild size="lg" className="w-full">
            <Link to={portalRoot(user)}>Volver a mi portal</Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link to={ROUTES.login}>Iniciar sesión</Link>
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
          <ArrowLeft /> Ir atrás
        </Button>
        {user && (
          <Button asChild variant="link" className="w-full">
            <Link to={ROUTES.home}>Ir al inicio</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
