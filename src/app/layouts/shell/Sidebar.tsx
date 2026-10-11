import { NavLink } from 'react-router-dom';
import { Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';
import type { NavGroup } from '../navigation';

interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ groups, collapsed = false, onNavigate }: SidebarNavProps) {
  const { user, hasPermission, hasModule } = useAuth();
  return (
    <nav className="space-y-6" aria-label="Navegación principal">
      {groups.map((group, gi) => {
        const items = group.items.filter((i) => !i.permission || !user || hasPermission(i.permission));
        if (!items.length) return null;
        return (
          <div key={gi} className="space-y-1">
            {group.label && !collapsed && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.label}</p>}
            {items.map((item) => {
              const locked = !!item.module && !!user && !hasModule(item.module);
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      isActive && 'bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1.5 h-6 w-[3px] rounded-r-full bg-brand" aria-hidden />}
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && locked && <Lock className="ml-auto h-3 w-3 opacity-60" aria-label="No contratado" />}
                    </>
                  )}
                </NavLink>
              );
              return collapsed ? (
                <Tooltip key={item.to} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}{locked ? ' (no contratado)' : ''}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  groups: NavGroup[];
  homeTo: string;
  badge?: string;
  collapsed: boolean;
  onToggle: () => void;
  footer?: React.ReactNode;
}

export function Sidebar({ groups, homeTo, badge, collapsed, onToggle, footer }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo to={homeTo} compact={collapsed} badge={badge} />
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav groups={groups} collapsed={collapsed} />
      </div>
      {footer && !collapsed && <div className="border-t p-3">{footer}</div>}
      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 items-center justify-center gap-2 border-t text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Contraer</>}
      </button>
    </aside>
  );
}
