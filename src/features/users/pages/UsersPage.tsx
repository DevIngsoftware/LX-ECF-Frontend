import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { PageTransition, Reveal } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatCard } from '@/components/shared/StatCard';
import { SearchInput } from '@/components/forms/SearchInput';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { usersService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { TenantUser } from '@/types/account';
import { formatNumber } from '@/utils/format';
import { RolesMatrix } from '../components/RolesMatrix';
import { UserFormDialog } from '../components/UserFormDialog';
import { UsersList, type UserAction } from '../components/UsersList';

type ConfirmKind = Exclude<UserAction, 'role'>;

const CONFIRM_COPY: Record<ConfirmKind, { title: string; description: string; label: string; destructive?: boolean }> = {
  reset: { title: 'Restablecer acceso', description: 'Enviaremos un correo al usuario con un enlace para crear una nueva contraseña.', label: 'Enviar enlace' },
  deactivate: { title: 'Desactivar usuario', description: 'El usuario no podrá iniciar sesión hasta que lo reactives. Su historial se conserva.', label: 'Desactivar', destructive: true },
  reactivate: { title: 'Reactivar usuario', description: 'El usuario podrá volver a iniciar sesión con su rol actual.', label: 'Reactivar' },
  remove: {
    title: 'Eliminar acceso del usuario',
    description: 'El usuario perderá el acceso a la empresa. Por trazabilidad fiscal, su historial de actividad se conserva en la auditoría.',
    label: 'Eliminar acceso',
    destructive: true,
  },
};

export function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TenantUser | null>(null);
  const [confirm, setConfirm] = useState<{ user: TenantUser; kind: ConfirmKind } | null>(null);

  const users = useQuery({ queryKey: queryKeys.users, queryFn: usersService.list });
  const all = useMemo(() => users.data ?? [], [users.data]);
  const activeAdmins = all.filter((u) => u.active && u.role === 'ADMIN').length;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : all;
  }, [all, search]);

  const isSelf = (u: TenantUser) => !!me && (u.id === me.id || u.email.toLowerCase() === me.email.toLowerCase());
  const isLastAdmin = (u: TenantUser) => u.active && u.role === 'ADMIN' && activeAdmins <= 1;

  const act = useMutation({
    mutationFn: ({ user, kind }: { user: TenantUser; kind: ConfirmKind }) =>
      kind === 'reset' ? usersService.sendPasswordReset(user.id) : usersService.setActive(user.id, kind === 'reactivate'),
    onSuccess: (_, { user, kind }) => {
      const msg: Record<ConfirmKind, string> = {
        reset: `Enlace de acceso enviado a ${user.email}`,
        deactivate: `${user.name} fue desactivado`,
        reactivate: `${user.name} fue reactivado`,
        remove: `Se eliminó el acceso de ${user.name}`,
      };
      toast.success(msg[kind]);
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onAction = (u: TenantUser, a: UserAction) => {
    if (a === 'role') {
      setEditing(u);
      setFormOpen(true);
      return;
    }
    if ((a === 'deactivate' || a === 'remove') && (isSelf(u) || isLastAdmin(u))) {
      toast.error(isSelf(u) ? 'No puedes desactivar tu propio usuario.' : 'Debe existir al menos un administrador activo.');
      return;
    }
    setConfirm({ user: u, kind: a });
  };

  const copy = confirm ? CONFIRM_COPY[confirm.kind] : null;

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Cuenta"
        title="Usuarios"
        description="Invita a tu equipo y define qué puede hacer cada persona."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><UserPlus /> Invitar usuario</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Usuarios" value={formatNumber(all.length)} icon={Users} tone="brand" loading={users.isLoading} />
        <StatCard index={1} label="Activos" value={formatNumber(all.filter((u) => u.active).length)} icon={UserCheck} tone="success" loading={users.isLoading} />
        <StatCard index={2} label="Administradores" value={formatNumber(activeAdmins)} icon={ShieldCheck} tone="info" loading={users.isLoading} />
      </div>

      <section className="surface mb-8 overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o correo" />
          <div className="hidden items-center gap-3 pr-12 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:flex">
            <span className="w-36">Rol</span>
            <span className="hidden w-24 md:block">Estado</span>
            <span className="hidden w-32 lg:block">Último acceso</span>
          </div>
        </div>
        <UsersList
          data={filtered}
          isLoading={users.isLoading}
          error={users.error}
          onRetry={() => void users.refetch()}
          isSelf={isSelf}
          isLastAdmin={isLastAdmin}
          onAction={onAction}
        />
      </section>

      <Reveal y={12}>
        <RolesMatrix />
      </Reveal>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} lockAdmin={!!editing && isLastAdmin(editing)} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && !act.isPending && setConfirm(null)}
        title={copy?.title ?? ''}
        description={copy?.description}
        confirmLabel={copy?.label}
        destructive={copy?.destructive}
        loading={act.isPending}
        onConfirm={() => confirm && act.mutate(confirm)}
      >
        {confirm && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{confirm.user.name}</p>
            <p className="text-muted-foreground">{confirm.user.email}</p>
          </div>
        )}
      </ConfirmDialog>
    </PageTransition>
  );
}
