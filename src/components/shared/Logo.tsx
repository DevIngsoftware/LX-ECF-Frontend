import { Link, useLocation } from 'react-router-dom';
import { COMPANY } from '@/constants/env';
import { cn } from '@/lib/utils';

interface LogoProps {
  to?: string;
  compact?: boolean;
  className?: string;
  badge?: string;
}

export function Logo({ to = '/', compact = false, className, badge }: LogoProps) {
  const { pathname, hash } = useLocation();
  return (
    <Link
      to={to}
      className={cn('group flex items-center gap-2.5 rounded-lg', className)}
      aria-label="LX e-CF, ir al inicio"
      onClick={(event) => {
        if (to === '/' && pathname === '/' && !hash) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
    >
      <img src={COMPANY.logo} alt="" className="h-7 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105" width={64} height={28} />
      {!compact && (
        <span className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold tracking-tight">
            LX <span className="text-brand">e-CF</span>
          </span>
          {badge && <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">{badge}</span>}
        </span>
      )}
    </Link>
  );
}
