import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { staggerContainer, staggerItem } from '@/components/animations/motion';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { ApiCredential } from '@/types/platform';
import { formatDate, formatRelative } from '@/utils/format';
import { Callout, DocHeader } from '../components/doc-ui';
import { CreateCredentialDialog } from '../components/CreateCredentialDialog';

export function CredentialsSection() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<ApiCredential | null>(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: queryKeys.credentials, queryFn: () => developersService.credentials() });

  const revoke = useMutation({
    mutationFn: (id: string) => developersService.revokeCredential(id),
    onSuccess: () => {
      toast.success('Credencial revocada');
      void qc.invalidateQueries({ queryKey: queryKeys.credentials });
      setRevoking(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DocHeader eyebrow="Mi cuenta" title="Credenciales" description="Crea y revoca las credenciales que usan tus sistemas para conectarse a la API." />
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus /> Nueva credencial
        </Button>
      </div>

      <div className="mb-6">
        <Callout tone="info">El secreto de cada credencial se muestra una sola vez al crearla. La plataforma solo conserva el prefijo.</Callout>
      </div>

      {isLoading ? (
        <LoadingState rows={3} className="surface p-5" />
      ) : error ? (
        <div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div>
      ) : !data?.length ? (
        <div className="surface">
          <EmptyState
            icon={KeyRound}
            title="Aún no tienes credenciales"
            description="Crea una credencial de pruebas para comenzar tu integración."
            action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus /> Nueva credencial</Button>}
          />
        </div>
      ) : (
        <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
          {data.map((c) => {
            const revoked = c.status === 'REVOCADA';
            return (
              <motion.li key={c.id} variants={staggerItem} className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <KeyRound className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge variant={c.environment === 'production' ? 'brand' : 'info'}>{c.environment === 'production' ? 'Producción' : 'Pruebas'}</Badge>
                    <GenericStatusBadge status={c.status} />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{c.prefix}••••••••</p>
                  <p className="text-xs text-muted-foreground">
                    Creada el {formatDate(c.createdAt)} · {c.lastUsedAt ? `Último uso ${formatRelative(c.lastUsedAt)}` : 'Sin uso registrado'}
                  </p>
                </div>
                {!revoked && (
                  <Button variant="outline" size="sm" className="self-start text-destructive hover:text-destructive sm:self-center" onClick={() => setRevoking(c)}>
                    <Trash2 /> Revocar
                  </Button>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <CreateCredentialDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && !revoke.isPending && setRevoking(null)}
        title="Revocar credencial"
        description={`Los sistemas que usan «${revoking?.name ?? ''}» dejarán de autenticarse de inmediato. Esta acción no se puede deshacer.`}
        confirmLabel="Revocar"
        destructive
        loading={revoke.isPending}
        onConfirm={() => revoking && revoke.mutate(revoking.id)}
      />
    </>
  );
}
