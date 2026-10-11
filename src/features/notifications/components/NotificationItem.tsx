import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { AppNotification } from '@/types/account';
import { formatRelative } from '@/utils/format';
import { cn } from '@/lib/utils';

const ICONS = {
  error: { icon: AlertCircle, cls: 'bg-destructive-soft text-destructive' },
  warning: { icon: AlertTriangle, cls: 'bg-warning-soft text-warning' },
  success: { icon: CheckCircle2, cls: 'bg-success-soft text-success' },
  info: { icon: Info, cls: 'bg-info-soft text-info' },
};

export function NotificationItem({ notification: n, onRead, compact }: { notification: AppNotification; onRead: () => void; compact?: boolean }) {
  const navigate = useNavigate();
  const { icon: Icon, cls } = ICONS[n.severity];
  return (
    <button
      type="button"
      onClick={() => {
        if (!n.read) onRead();
        if (n.link) navigate(n.link);
      }}
      className={cn('flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60', !n.read && 'bg-brand-soft/30')}
    >
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('truncate text-sm', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</span>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="No leída" />}
        </span>
        <span className={cn('block text-xs text-muted-foreground', compact && 'line-clamp-2')}>{n.message}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground/80">{formatRelative(n.createdAt)}</span>
      </span>
    </button>
  );
}
