import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/services/api/auth';
import { errorMessage } from '@/services/http/errors';
import { AuthHeader } from '../components/AuthHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 60;

function readEmail(state: unknown): string {
  if (state && typeof state === 'object' && 'email' in state) {
    const v = (state as { email: unknown }).email;
    if (typeof v === 'string') return v;
  }
  return '';
}

function TokenVerification({ token }: { token: string }) {
  const started = useRef(false);
  const verify = useMutation({ mutationFn: () => authService.verifyEmail(token) });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    verify.mutate();
  }, [verify]);

  if (verify.isError) {
    return (
      <div className="text-center">
        <AuthHeader center icon={AlertTriangle} tone="danger" title="No pudimos verificar tu correo" description={errorMessage(verify.error)} />
        <div className="flex flex-col gap-3">
          <Button onClick={() => verify.mutate()}><RefreshCw /> Reintentar</Button>
          <Button asChild variant="outline"><Link to={ROUTES.login}>Ir a iniciar sesión</Link></Button>
        </div>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="text-center">
        <AuthHeader center icon={CheckCircle2} tone="success" title="Correo verificado" description="Tu cuenta está lista. Inicia sesión para configurar tu empresa." />
        <Button asChild size="lg" className="w-full"><Link to={ROUTES.login}>Iniciar sesión</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
      <p className="text-sm text-muted-foreground">Verificando tu correo electrónico...</p>
    </div>
  );
}

function CheckInbox({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [cooldown, setCooldown] = useState(0);
  const [touched, setTouched] = useState(false);
  const valid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const resend = useMutation({
    mutationFn: () => authService.resendVerification(email.trim()),
    onSuccess: () => {
      toast.success('Si el correo está registrado, te enviamos un nuevo enlace.');
      setCooldown(RESEND_COOLDOWN);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <AuthHeader
        icon={MailCheck}
        title="Revisa tu correo"
        description={
          initialEmail ? (
            <>Enviamos un enlace de verificación a <span className="font-semibold text-foreground">{initialEmail}</span>. Ábrelo para activar tu cuenta.</>
          ) : (
            'Te enviamos un enlace de verificación. Ábrelo para activar tu cuenta.'
          )
        }
      />
      <div className="surface space-y-4 p-5">
        <p className="text-sm text-muted-foreground">¿No lo recibiste? Revisa la carpeta de correo no deseado o solicita un nuevo enlace.</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (valid && cooldown === 0) resend.mutate();
          }}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="verify-email">Correo electrónico</Label>
            <Input id="verify-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={touched && !valid} />
            {touched && !valid && <p className="text-xs font-medium text-destructive">Ingresa un correo válido.</p>}
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={resend.isPending || cooldown > 0}>
            {resend.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {cooldown > 0 ? `Reenviar en ${cooldown} s` : 'Reenviar enlace'}
          </Button>
        </form>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Ya verificaste tu cuenta?{' '}
        <Link to={ROUTES.login} className="font-semibold text-brand hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const token = params.get('token');
  return token ? <TokenVerification token={token} /> : <CheckInbox initialEmail={readEmail(location.state)} />;
}
