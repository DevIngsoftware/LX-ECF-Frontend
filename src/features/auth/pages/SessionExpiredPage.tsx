import { Link } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { AuthHeader } from '../components/AuthHeader';

export function SessionExpiredPage() {
  return (
    <div className="text-center">
      <AuthHeader
        center
        icon={Clock}
        tone="warning"
        title="Tu sesión ha expirado"
        description="Por seguridad, cerramos tu sesión después de un período de inactividad o cuando tus credenciales dejan de ser válidas. Inicia sesión nuevamente para continuar."
      />
      <div className="space-y-3">
        <Button asChild size="lg" className="w-full">
          <Link to={ROUTES.login}><LogIn /> Iniciar sesión</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to={ROUTES.home}>Ir al inicio</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Si usas un equipo compartido, recuerda cerrar sesión al terminar.</p>
    </div>
  );
}
