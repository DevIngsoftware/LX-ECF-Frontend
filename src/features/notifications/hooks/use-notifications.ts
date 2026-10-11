import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';

/** Polling cada 60 s. Sustituible por SSE/WebSocket cuando el backend lo exponga. */
export function useNotifications() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.notifications, queryFn: notificationsService.list, refetchInterval: 60000 });
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.notifications });
  const markRead = useMutation({ mutationFn: notificationsService.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: invalidate });
  const unread = query.data?.filter((n) => !n.read).length ?? 0;
  return { ...query, unread, markRead, markAllRead };
}
