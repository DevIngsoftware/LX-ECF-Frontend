import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { InternalUser } from '@/types/platform';
import { ADMIN_ROLES } from './admin-meta';

const schema = z.object({
  name: z.string().trim().min(3, 'Ingresa el nombre completo').max(80, 'Máximo 80 caracteres'),
  email: z.string().trim().min(1, 'El correo es obligatorio').email('Correo electrónico inválido'),
  role: z.enum(['SUPERADMIN', 'SOPORTE', 'COMERCIAL', 'FINANZAS'], { required_error: 'Selecciona un rol' }),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const toValues = (u?: InternalUser | null): FormValues => ({
  name: u?.name ?? '',
  email: u?.email ?? '',
  role: u?.role ?? 'SOPORTE',
  active: u?.active ?? true,
});

export function InternalUserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: InternalUser | null }) {
  const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(user) });

  useEffect(() => {
    if (open) form.reset(toValues(user));
  }, [open, user, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      adminService.saveUser({ ...(user ? { id: user.id, lastLoginAt: user.lastLoginAt } : {}), name: v.name.trim(), email: v.email.trim().toLowerCase(), role: v.role, active: v.active }),
    onSuccess: () => {
      toast.success(user ? 'Usuario actualizado' : 'Invitación enviada');
      void qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuario interno' : 'Invitar usuario interno'}</DialogTitle>
          <DialogDescription>Los usuarios internos acceden al portal de administración de LoadExpress.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="nombre@loadexpress.com" autoComplete="off" />
                  </FormControl>
                  {!user && <FormDescription>Recibirá un enlace para definir su contraseña.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADMIN_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{ADMIN_ROLES.find((r) => r.value === field.value)?.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>Los usuarios inactivos no pueden iniciar sesión.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {user ? 'Guardar cambios' : 'Enviar invitación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
