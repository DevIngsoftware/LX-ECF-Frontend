import { Link, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Link2Off, Loader2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/services/api/auth';
import { errorMessage } from '@/services/http/errors';
import { AuthHeader } from '../components/AuthHeader';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';

const schema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128, 'Máximo 128 caracteres.'),
    confirm: z.string().min(1, 'Confirma tu contraseña.'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden.' });
type Values = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });
  const password = useWatch({ control: form.control, name: 'password' });

  const mutation = useMutation({
    mutationFn: (v: Values) => authService.resetPassword(token, v.password),
    onSuccess: () => toast.success('Contraseña actualizada correctamente.'),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!token) {
    return (
      <div className="text-center">
        <AuthHeader center icon={Link2Off} tone="danger" title="Enlace no válido" description="El enlace de restablecimiento no es válido o ha expirado. Solicita uno nuevo para continuar." />
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full"><Link to={ROUTES.forgotPassword}>Solicitar nuevo enlace</Link></Button>
          <Button asChild variant="ghost" className="w-full"><Link to={ROUTES.login}>Volver a iniciar sesión</Link></Button>
        </div>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center">
        <AuthHeader center icon={CheckCircle2} tone="success" title="Contraseña actualizada" description="Ya puedes iniciar sesión con tu nueva contraseña." />
        <Button asChild size="lg" className="w-full"><Link to={ROUTES.login}>Iniciar sesión</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader icon={LockKeyhole} title="Crea una nueva contraseña" description="Elige una contraseña segura que no hayas usado antes." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl><PasswordInput autoComplete="new-password" placeholder="Mínimo 8 caracteres" autoFocus {...field} /></FormControl>
                <PasswordStrength value={password ?? ''} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl><PasswordInput autoComplete="new-password" placeholder="Repite la contraseña" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            {mutation.isPending ? 'Guardando...' : 'Restablecer contraseña'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
