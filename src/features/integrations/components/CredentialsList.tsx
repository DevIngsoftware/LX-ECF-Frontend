import { KeyRound, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApiCredential } from '@/types/platform';
import { formatDate, formatRelative } from '@/utils/format';

interface Props {
  data?: ApiCredential[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onRevoke: (c: ApiCredential) => void;
  onCreate: () => void;
}

export function EnvironmentBadge({ env }: { env: ApiCredential['environment'] }) {
  return env === 'production' ? <Badge variant="brand">Producción</Badge> : <Badge variant="neutral">Sandbox</Badge>;
}

export function CredentialsList({ data, isLoading, error, onRetry, onRevoke, onCreate }: Props) {
  if (isLoading) return <div className="p-5"><LoadingState rows={3} /></div>;
  if (error) return <ErrorState compact error={error} onRetry={onRetry} />;
  if (!data?.length) {
    return (
      <EmptyState
        compact
        icon={KeyRound}
        title="Sin credenciales"
        description="Crea una credencial para conectar tu ERP, POS o tienda en línea."
        action={<Button size="sm" onClick={onCreate}>Crear credencial</Button>}
      />
    );
  }

  return (
    <>
      {/* Móvil: tarjetas */}
      <ul className="divide-y md:hidden">
        {data.map((c) => (
          <li key={c.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <code className="font-mono text-xs text-muted-foreground">{c.prefix}…</code>
              </div>
              <EnvironmentBadge env={c.environment} />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Creada {formatDate(c.createdAt)} · {c.lastUsedAt ? `Usada ${formatRelative(c.lastUsedAt)}` : 'Sin uso'}</span>
              <GenericStatusBadge status={c.status} />
            </div>
            {c.status !== 'REVOCADA' && (
              <Button size="sm" variant="outline" className="w-full text-destructive" onClick={() => onRevoke(c)}><Trash2 /> Revocar</Button>
            )}
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ambiente</TableHead>
              <TableHead>Prefijo</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead>Último uso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id} className={c.status === 'REVOCADA' ? 'opacity-60' : undefined}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><EnvironmentBadge env={c.environment} /></TableCell>
                <TableCell><code className="font-mono text-xs">{c.prefix}…</code></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{c.lastUsedAt ? formatRelative(c.lastUsedAt) : 'Sin uso'}</TableCell>
                <TableCell><GenericStatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right">
                  {c.status !== 'REVOCADA' && (
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onRevoke(c)}>
                      <Trash2 /> Revocar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
