import { KeyRound, MoreHorizontal, Power, PowerOff, Trash2, UserCog, Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TenantUser } from '@/types/account';
import { formatRelative, initials } from '@/utils/format';
import { cn } from '@/lib/utils';
import { ROLE_META } from './roles';

export type UserAction = 'role' | 'reset' | 'deactivate' | 'reactivate' | 'remove';

interface Props {
  data?: TenantUser[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isSelf: (u: TenantUser) => boolean;
  isLastAdmin: (u: TenantUser) => boolean;
  onAction: (u: TenantUser, a: UserAction) => void;
}

export function UsersList({ data, isLoading, error, onRetry, isSelf, isLastAdmin, onAction }: Props) {
  if (isLoading) return <div className="p-5"><LoadingState rows={4} className="[&>*]:h-14" /></div>;
  if (error) return <ErrorState compact error={error} onRetry={onRetry} />;
  if (!data?.length) return <EmptyState compact icon={Users} title="Sin usuarios" description="Invita a tu equipo para colaborar en la facturación." />;

  return (
    <ul className="divide-y">
      {data.map((u) => {
        const self = isSelf(u);
        const protectedUser = self || isLastAdmin(u);
        const role = ROLE_META[u.role];
        return (
          <li key={u.id} className={cn('flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40', !u.active && 'opacity-70')}>
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn('text-sm font-semibold', u.active ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground')}>
                {initials(u.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate font-medium">
                <span className="truncate">{u.name}</span>
                {self && <Badge variant="outline" className="shrink-0">Tú</Badge>}
              </p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                <StatusBadge label={role?.label ?? u.role} tone={role?.tone ?? 'neutral'} />
                <StatusBadge label={u.active ? 'Activo' : 'Inactivo'} tone={u.active ? 'success' : 'neutral'} />
              </div>
            </div>
            <div className="hidden w-36 sm:block"><StatusBadge label={role?.label ?? u.role} tone={role?.tone ?? 'neutral'} /></div>
            <div className="hidden w-24 md:block"><StatusBadge label={u.active ? 'Activo' : 'Inactivo'} tone={u.active ? 'success' : 'neutral'} /></div>
            <div className="hidden w-32 text-sm text-muted-foreground lg:block">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Nunca'}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.name}`}><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => onAction(u, 'role')} disabled={self}><UserCog /> Cambiar rol</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAction(u, 'reset')} disabled={!u.active}><KeyRound /> Restablecer acceso</DropdownMenuItem>
                <DropdownMenuSeparator />
                {u.active ? (
                  <DropdownMenuItem onSelect={() => onAction(u, 'deactivate')} disabled={protectedUser}><PowerOff /> Desactivar</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onSelect={() => onAction(u, 'reactivate')}><Power /> Reactivar</DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => onAction(u, 'remove')} disabled={protectedUser} className="text-destructive focus:text-destructive">
                  <Trash2 /> Eliminar acceso
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        );
      })}
    </ul>
  );
}
