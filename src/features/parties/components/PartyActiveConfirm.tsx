import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { partiesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Party, PartyKind } from '@/types/business';
import { PARTY_META } from './party-meta';

interface PartyActiveConfirmProps {
  kind: PartyKind;
  party: Party | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * El backend no elimina registros fiscales: se desactivan para conservar el historial.
 */
export function PartyActiveConfirm({ kind, party, onOpenChange }: PartyActiveConfirmProps) {
  const meta = PARTY_META[kind];
  const qc = useQueryClient();
  const deactivating = !!party?.active;

  const mutation = useMutation({
    mutationFn: (p: Party) => partiesService.setActive(kind, p.id, !p.active),
    onSuccess: (_, p) => {
      toast.success(p.active ? `${meta.singularCap} desactivado` : `${meta.singularCap} reactivado`);
      void qc.invalidateQueries({ queryKey: ['parties', kind] });
      if (kind === 'customers') void qc.invalidateQueries({ queryKey: ['invoice-customers'] });
      void qc.invalidateQueries({ queryKey: queryKeys.party(kind, p.id) });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <ConfirmDialog
      open={!!party}
      onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}
      title={deactivating ? `Desactivar ${meta.singular}` : `Reactivar ${meta.singular}`}
      description={
        deactivating
          ? `${party?.legalName ?? ''} dejará de estar disponible para nuevos comprobantes. Su historial fiscal se conserva y podrás reactivarlo en cualquier momento.`
          : `${party?.legalName ?? ''} volverá a estar disponible para nuevos comprobantes.`
      }
      confirmLabel={deactivating ? 'Desactivar' : 'Reactivar'}
      destructive={deactivating}
      loading={mutation.isPending}
      onConfirm={() => party && mutation.mutate(party)}
    />
  );
}
