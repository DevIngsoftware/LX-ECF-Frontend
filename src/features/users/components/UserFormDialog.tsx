import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usersService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { TenantRole, TenantUser } from '@/types/account';
import { cn } from '@/lib/utils';
import { ROLE_META, ROLES } from './roles';

const schema = z.object({
  name: z.string().trim().min(3, 'Ingresa el nombre completo').max(80, 'Máximo 80 caracteres'),
  email: z.string().trim().min(1, 'Ingresa el correo').email('Correo electrónico no válido'),
  role: z.enum(['ADMIN', 'FACTURACION', 'CONTABILIDAD', 'CONSULTA'], { required_error: 'Selecciona un rol' }),
});
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Si se indica, el diálogo cambia el rol del usuario; si no, invita a uno nuevo. */
  user?: TenantUser | null;
  /** Impide quitar el rol de administrador al último administrador activo. */
  lockAdmin?: boolean;
}

const EMPTY: Values = { name: '', email: '', role: 'FACTURACION' };

export function UserFormDialog({ open, onOpenChange, user, lockAdmin }: Props) {
  const qc = useQueryClient();
  const editing = !!user;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) form.reset(user ? { name: user.name, email: user.email, role: user.role } : EMPTY);
  }, [open, user, form]);

  const save = useMutation({
    mutationFn: (v: Values) =>
      user ? usersService.update(user.id, { ...v, active: user.active }) : usersService.create({ ...v, active: true }),
    onSuccess: (result, v) => {
      if (!editing && 'emailSent' in result && result.emailSent === false) toast.warning(`Usuario creado, pero no se envió el correo a ${v.email}. Puedes reenviarlo desde su ficha.`);
      else toast.success(editing ? `Rol actualizado a ${ROLE_META[v.role].label}` : `Invitación enviada a ${v.email}`);
      void qc.invalidateQueries({ queryKey: queryKeys.users });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Cambiar rol' : 'Invitar usuario'}</DialogTitle>
          <DialogDescription>
            {editing ? `Define qué puede hacer ${user?.name} en LX e-CF.` : 'El usuario recibirá un correo para crear su contraseña y acceder a la empresa.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="user-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input autoComplete="off" placeholder="Nombre y apellido" disabled={editing} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl><Input type="email" autoComplete="off" placeholder="usuario@empresa.com" disabled={editing} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={(v) => field.onChange(v as TenantRole)} className="grid gap-2">
                      {ROLES.map((r) => {
                        const disabled = !!lockAdmin && r !== 'ADMIN';
                        return (
                          <label
                            key={r}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                              field.value === r ? 'border-brand bg-brand-soft/40' : 'hover:bg-muted/50',
                              disabled && 'cursor-not-allowed opacity-50',
                            )}
                          >
                            <RadioGroupItem value={r} className="mt-0.5" disabled={disabled} />
                            <span>
                              <span className="block text-sm font-medium">{ROLE_META[r].label}</span>
                              <span className="block text-xs text-muted-foreground">{ROLE_META[r].description}</span>
                            </span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  {lockAdmin && <FormDescription>Debe existir al menos un administrador activo.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>Cancelar</Button>
          <Button type="submit" form="user-form" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : editing ? <Save /> : <Mail />}
            {editing ? 'Guardar cambios' : 'Enviar invitación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
