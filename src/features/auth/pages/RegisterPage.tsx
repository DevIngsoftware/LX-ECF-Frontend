import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/services/api/auth';
import { errorMessage } from '@/services/http/errors';
import { AuthHeader } from '../components/AuthHeader';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';

const schema = z
  .object({
    companyName: z.string().trim().min(2, 'Ingresa el nombre de la empresa.').max(150, 'Máximo 150 caracteres.'),
    rnc: z
      .string()
      .trim()
      .transform((v) => v.replace(/-/g, ''))
      .refine((v) => /^(\d{9}|\d{11})$/.test(v), 'El RNC debe tener 9 dígitos (o 11 si es cédula).'),
    ownerName: z.string().trim().min(3, 'Ingresa tu nombre completo.').max(120, 'Máximo 120 caracteres.'),
    email: z.string().trim().min(1, 'Ingresa tu correo.').email('Ingresa un correo válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(128, 'Máximo 128 caracteres.'),
    confirm: z.string().min(1, 'Confirma tu contraseña.'),
    acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos y condiciones.'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden.' });

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: '', rnc: '', ownerName: '', email: '', password: '', confirm: '', acceptTerms: false },
  });
  const password = useWatch({ control: form.control, name: 'password' });

  const mutation = useMutation({
    mutationFn: (v: FormOutput) => authService.register({ companyName: v.companyName, rnc: v.rnc, ownerName: v.ownerName, email: v.email, password: v.password }),
    onSuccess: (res, v) => {
      if (res.emailSent === false) toast.warning('Cuenta creada, pero el correo no salió. Solicita un nuevo enlace.');
      else toast.success('Cuenta creada. Revisa tu correo para verificarla.');
      navigate(ROUTES.verifyEmail, { state: { email: res.email || v.email, emailSent: res.emailSent !== false } });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <AuthHeader title="Crea tu cuenta" description="Registra tu empresa y comienza a configurar la facturación electrónica." />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la empresa</FormLabel>
                  <FormControl><Input autoComplete="organization" placeholder="Mi Empresa, S.R.L." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rnc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RNC</FormLabel>
                  <FormControl><Input inputMode="numeric" placeholder="9 u 11 dígitos" maxLength={13} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del responsable</FormLabel>
                <FormControl><Input autoComplete="name" placeholder="Nombre y apellido" {...field} /></FormControl>
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
                <FormControl><Input type="email" autoComplete="email" placeholder="nombre@empresa.com" {...field} /></FormControl>
                <FormDescription>Será tu usuario de acceso y donde recibirás la verificación.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl><PasswordInput autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
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
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="space-y-1 pt-1">
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox className="mt-0.5" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <FormLabel className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground">
                    Acepto los términos y condiciones de uso y la política de privacidad de LX e-CF.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            {mutation.isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to={ROUTES.login} className="font-semibold text-brand hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
