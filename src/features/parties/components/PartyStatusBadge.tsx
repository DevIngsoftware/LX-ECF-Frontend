import { StatusBadge } from '@/components/shared/StatusBadge';

export function PartyStatusBadge({ active }: { active: boolean }) {
  return <StatusBadge label={active ? 'Activo' : 'Inactivo'} tone={active ? 'success' : 'neutral'} />;
}
