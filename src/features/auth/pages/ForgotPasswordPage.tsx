import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/services/api/auth';
import { toApiError } from '@/services/http/errors';
import { toast } from 'sonner';
import { AuthHeader } from '../components/AuthHeader';

const schema = z.object({ email: z.string().trim().min(1, 'Ingresa tu correo.').email('Ingresa un correo válido.') });
type Values = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }: Values) => {
    try {
      await authService.forgotPassword(email);
      setSentTo(email);
    } catch (err) {
      // Respuesta neutral: no revelamos si el correo existe. Solo informamos fallas de conexión.
      const e = toApiError(err);
      if (e.kind === 'network' || e.kind === 'timeout' || e.kind === 'server') {
        toast.error(e.message);
        return;
      }
      setSentTo(email);
    }
  };

  if (sentTo) {
    return (
      <div>
        <AuthHeader
          icon={MailCheck}
          tone="success"
          title="Revisa tu correo"
          description="Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos."
        />
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full"><Link to={ROUTES.login}>Volver a iniciar sesión</Link></Button>
          <Button variant="ghost" className="w-full" onClick={() => setSentTo(null)}>Usar otro correo</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader icon={KeyRound} title="Recupera tu contraseña" description="Ingresa el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl><Input type="email" autoComplete="email" placeholder="nombre@empresa.com" autoFocus {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            {form.formState.isSubmitting ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>
      </Form>
      <Link to={ROUTES.login} className="mt-8 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
      </Link>
    </div>
  );
}
