import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-context';
import { ROUTES } from '@/constants/routes';
import { initials } from '@/utils/format';

export function UserMenu({ settingsTo }: { settingsTo?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-border" aria-label="Menú de perfil">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-foreground text-xs font-semibold text-background">{initials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.tenant && <p className="mt-1 truncate text-xs text-brand">{user.tenant.name}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {settingsTo && (
          <>
            <DropdownMenuItem asChild>
              <Link to={settingsTo === ROUTES.app.settings ? ROUTES.app.settingsSection('seguridad') : settingsTo}>
                <User className="mr-2 h-4 w-4" /> Mi perfil y seguridad
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={settingsTo}>
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            await logout();
            navigate(ROUTES.login);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
