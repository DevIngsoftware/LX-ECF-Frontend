import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { NavGroup } from '../navigation';

export function Breadcrumbs({ groups, rootLabel, rootTo }: { groups: NavGroup[]; rootLabel: string; rootTo: string }) {
  const { pathname } = useLocation();
  const items = groups.flatMap((g) => g.items);
  const match = items
    .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const crumbs: { label: string; to?: string }[] = [{ label: rootLabel, to: rootTo }];
  if (match && match.to !== rootTo) crumbs.push({ label: match.label, to: match.to });
  if (match && pathname !== match.to && pathname.startsWith(`${match.to}/`)) crumbs.push({ label: 'Detalle' });
  if (!match && pathname !== rootTo) crumbs.push({ label: pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? '' });

  return (
    <nav aria-label="Ruta de navegación" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />}
            {c.to && !last ? (
              <Link to={c.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">{c.label}</Link>
            ) : (
              <span className="truncate font-medium first-letter:uppercase" aria-current={last ? 'page' : undefined}>{c.label}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
