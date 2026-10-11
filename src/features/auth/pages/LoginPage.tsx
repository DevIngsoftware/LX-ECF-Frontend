import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle, FlaskConical, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/auth-context';
import { ENV } from '@/constants/env';
import { ROUTES } from '@/constants/routes';
import { errorMessage } from '@/services/http/errors';
import { AuthHeader } from '../components/AuthHeader';
import { PasswordInput } from '../components/PasswordInput';
import { safeRedirect } from '../components/portal';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Ingresa tu correo o usuario.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
  remember: z.boolean(),
});

type Values = z.infer<typeof schema>;

function readFrom(state: unknown): unknown {
  if (!state || typeof state !== 'object' || !('from' in state)) return undefined;
  const from = (state as { from: unknown }).from;
  if (from && typeof from === 'object' && 'pathname' in from) return (from as { pathname: unknown }).pathname;
  return from;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '', remember: true } });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      const user = await login(values);
      toast.success(`Bienvenido, ${user.name}`);
      navigate(safeRedirect(readFrom(location.state), user), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <div>
      <AuthHeader title="Iniciar sesión" description="Accede a tu cuenta de LX e-CF para gestionar tus comprobantes electrónicos." />

      {ENV.useMocks && (
        <div className="mb-6 flex gap-3 rounded-xl border border-dashed border-brand/40 bg-brand-soft/60 p-4 text-sm">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Modo demostración:</span> cualquier correo y contraseña de 4+ caracteres; usa un correo que contenga 'admin' para el panel LX.
          </p>
        </div>
      )}

      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo o usuario</FormLabel>
                <FormControl>
                  <Input autoComplete="username" placeholder="nombre@empresa.com" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Contraseña</FormLabel>
                  <Link to={ROUTES.forgotPassword} className="text-xs font-medium text-brand hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="Tu contraseña" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm font-normal">{ENV.useMocks ? 'Mantener sesión al recargar' : 'Recordarme en este dispositivo'}</FormLabel>
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{' '}
        <Link to={ROUTES.register} className="font-semibold text-brand hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
