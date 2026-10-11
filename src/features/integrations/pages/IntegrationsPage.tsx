import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, BookOpen, KeyRound, Plus, ShieldCheck, Webhook } from 'lucide-react';
import { PageTransition, Reveal } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ApiCredential } from '@/types/platform';
import { formatNumber } from '@/utils/format';
import { CreateCredentialDialog } from '../components/CreateCredentialDialog';
import { CredentialsList, EnvironmentBadge } from '../components/CredentialsList';

export function IntegrationsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiCredential | null>(null);
  const creds = useQuery({ queryKey: queryKeys.credentials, queryFn: developersService.credentials });

  const revoke = useMutation({
    mutationFn: (c: ApiCredential) => developersService.revokeCredential(c.id),
    onSuccess: (_, c) => {
      toast.success(`Credencial «${c.name}» revocada`);
      setRevoking(null);
      void qc.invalidateQueries({ queryKey: queryKeys.credentials });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const list = creds.data ?? [];
  const active = list.filter((c) => c.status === 'ACTIVA');

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Cuenta"
        title="Integraciones"
        description="Conecta tus sistemas con LX e-CF mediante credenciales de API seguras."
        actions={
          <>
            <Button asChild variant="outline"><Link to={ROUTES.developers.root}><BookOpen /> Documentación</Link></Button>
            <Button onClick={() => setCreating(true)}><Plus /> Nueva credencial</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Credenciales activas" value={formatNumber(active.length)} icon={KeyRound} tone="brand" loading={creds.isLoading} />
        <StatCard index={1} label="Sandbox" value={formatNumber(active.filter((c) => c.environment === 'sandbox').length)} icon={ShieldCheck} tone="info" loading={creds.isLoading} hint="Pruebas sin efecto fiscal" />
        <StatCard index={2} label="Producción" value={formatNumber(active.filter((c) => c.environment === 'production').length)} icon={ShieldCheck} tone="success" loading={creds.isLoading} hint="Emisión real ante la DGII" />
      </div>

      <section className="surface mb-6 overflow-hidden">
        <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Credenciales de API</h2>
            <p className="text-sm text-muted-foreground">La API Key y el secreto se muestran al crearlos. El secreto se guarda en la API solo como hash.</p>
          </div>
        </div>
        <CredentialsList
          data={creds.data}
          isLoading={creds.isLoading}
          error={creds.error}
          onRetry={() => void creds.refetch()}
          onRevoke={setRevoking}
          onCreate={() => setCreating(true)}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Reveal y={12}>
          <div className="surface flex h-full flex-col p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><BookOpen className="h-5 w-5" /></span>
              <h3 className="font-semibold">Portal para desarrolladores</h3>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">Guías de autenticación, ejemplos de emisión, consulta de estados y monitoreo de uso de la API.</p>
            <Button asChild variant="link" className="mt-3 h-auto justify-start p-0">
              <Link to={ROUTES.developers.root}>Ir al portal <ArrowRight /></Link>
            </Button>
          </div>
        </Reveal>
        <Reveal y={12} delay={0.05}>
          <div className="surface flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Webhook className="h-5 w-5" /></span>
                <h3 className="font-semibold">Webhooks</h3>
              </div>
              <Badge variant="neutral">Próximamente</Badge>
            </div>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">Recibe notificaciones automáticas en tu sistema cuando la DGII acepte o rechace un comprobante.</p>
          </div>
        </Reveal>
      </div>

      <CreateCredentialDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && !revoke.isPending && setRevoking(null)}
        title="Revocar credencial"
        description="Los sistemas que usen esta credencial dejarán de poder conectarse de inmediato. Esta acción no se puede deshacer."
        confirmLabel="Revocar"
        destructive
        loading={revoke.isPending}
        onConfirm={() => revoking && revoke.mutate(revoking)}
      >
        {revoking && (
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{revoking.name}</p>
              <code className="font-mono text-xs text-muted-foreground">{revoking.prefix}…</code>
            </div>
            <EnvironmentBadge env={revoking.environment} />
          </div>
        )}
      </ConfirmDialog>
    </PageTransition>
  );
}
