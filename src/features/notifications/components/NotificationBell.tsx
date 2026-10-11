import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { useNotifications } from '../hooks/use-notifications';
import { NotificationItem } from './NotificationItem';

export function NotificationBell({ allTo }: { allTo: string }) {
  const { data, isLoading, unread, markRead, markAllRead } = useNotifications();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          <Button variant="ghost" size="xs" onClick={() => markAllRead.mutate()} disabled={!unread || markAllRead.isPending}>
            <CheckCheck /> Marcar todas
          </Button>
        </div>
        <ScrollArea className="max-h-[380px]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !data?.length ? (
            <EmptyState compact title="Sin notificaciones" description="Te avisaremos cuando ocurra algo importante." />
          ) : (
            <ul className="divide-y">
              {data.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <NotificationItem notification={n} onRead={() => markRead.mutate(n.id)} compact />
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full">
            <Link to={allTo}>Ver todas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
