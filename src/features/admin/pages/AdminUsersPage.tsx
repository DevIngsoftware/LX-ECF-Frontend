import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Power, UserPlus, Users } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-context';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Page } from '@/types/common';
import type { InternalUser } from '@/types/platform';
import { formatRelative, initials } from '@/utils/format';
import { ADMIN_ROLES, roleLabel } from '../components/admin-meta';
import { FilterSelect } from '../components/FilterSelect';
import { InternalUserDialog } from '../components/InternalUserDialog';

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [pageIndex, setPageIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InternalUser | null>(null);
  const [toggling, setToggling] = useState<InternalUser | null>(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.admin.users, queryFn: () => adminService.users() });

  const toggle = useMutation({
    mutationFn: (u: InternalUser) => adminService.saveUser({ ...u, active: !u.active }),
    onSuccess: (_, u) => {
      toast.success(u.active ? 'Usuario desactivado' : 'Usuario reactivado');
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      setToggling(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // El servicio devuelve la lista completa: filtro y paginación en el cliente.
  const page = useMemo<Page<InternalUser> | undefined>(() => {
    if (!data) return undefined;
    const q = search.trim().toLowerCase();
    const list = data.filter((u) => (role === 'ALL' || u.role === role) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
    return { content: list.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE), page: pageIndex, size: PAGE_SIZE, totalElements: list.length, totalPages: Math.max(1, Math.ceil(list.length / PAGE_SIZE)) };
  }, [data, search, role, pageIndex]);

  const openForm = (u: InternalUser | null) => {
    setEditing(u);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<InternalUser, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Usuario',
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(row.original.name)}</span>
            <div className="min-w-0">
              <p className="max-w-[220px] truncate font-medium">{row.original.name}</p>
              <p className="max-w-[220px] truncate text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { id: 'role', header: 'Rol', cell: ({ row }) => <Badge variant={row.original.role === 'SUPERADMIN' ? 'brand' : 'outline'}>{roleLabel(row.original.role)}</Badge> },
      { id: 'active', header: 'Estado', cell: ({ row }) => <StatusBadge label={row.original.active ? 'Activo' : 'Inactivo'} tone={row.original.active ? 'success' : 'neutral'} /> },
      { id: 'lastLoginAt', header: 'Último acceso', cell: ({ row }) => <span className="text-muted-foreground">{row.original.lastLoginAt ? formatRelative(row.original.lastLoginAt) : 'Nunca'}</span> },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const isMe = row.original.id === me?.id;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${row.original.name}`}><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openForm(row.original)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={isMe} onSelect={() => setToggling(row.original)} className={row.original.active ? 'text-destructive focus:text-destructive' : undefined}>
                    <Power className="mr-2 h-4 w-4" /> {row.original.active ? 'Desactivar' : 'Reactivar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [me?.id],
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Operación"
        title="Usuarios internos"
        description="Equipo de LoadExpress con acceso al portal de administración."
        actions={<Button onClick={() => openForm(null)}><UserPlus /> Invitar usuario</Button>}
      />
      <DataTable
        columns={columns}
        page={page}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        getRowId={(r) => r.id}
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPageIndex(0); }} placeholder="Buscar por nombre o correo" />
            <FilterSelect value={role} onChange={(v) => { setRole(v); setPageIndex(0); }} options={ADMIN_ROLES} allLabel="Todos los roles" ariaLabel="Filtrar por rol" />
          </div>
        }
        empty={!search && role === 'ALL' ? <EmptyState compact icon={Users} title="Aún no hay usuarios internos" /> : undefined}
      />

      <InternalUserDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && !toggle.isPending && setToggling(null)}
        title={toggling?.active ? 'Desactivar usuario' : 'Reactivar usuario'}
        description={toggling?.active ? `${toggling.name} perderá el acceso al portal de administración.` : `${toggling?.name ?? ''} podrá volver a iniciar sesión.`}
        confirmLabel={toggling?.active ? 'Desactivar' : 'Reactivar'}
        destructive={!!toggling?.active}
        loading={toggle.isPending}
        onConfirm={() => toggling && toggle.mutate(toggling)}
      />
    </PageTransition>
  );
}
