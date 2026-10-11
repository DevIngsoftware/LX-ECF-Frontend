import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { SETTINGS_SECTIONS, type SettingsSlug } from './sections';

const GROUPS = ['Empresa', 'Facturación electrónica', 'Cuenta'] as const;

export function SettingsNav({ active, attention }: { active: SettingsSlug | null; attention: Set<string> }) {
  const item = (to: string, label: string, Icon: typeof LayoutGrid, isActive: boolean, warn: boolean, mobile: boolean) => (
    <Link
      key={to}
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 text-sm font-medium transition-colors',
        mobile
          ? cn('shrink-0 rounded-full border px-3 py-1.5', isActive ? 'border-brand bg-brand text-white' : 'bg-card text-muted-foreground hover:text-foreground')
          : cn('rounded-lg px-3 py-2', isActive ? 'bg-brand-soft text-brand' : 'text-muted-foreground hover:bg-muted hover:text-foreground'),
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className={mobile ? undefined : 'flex-1 truncate'}>{label}</span>
      {warn && <span className={cn('h-2 w-2 shrink-0 rounded-full', isActive && mobile ? 'bg-white' : 'bg-warning')} aria-label="Requiere atención" />}
    </Link>
  );

  return (
    <>
      {/* Móvil: chips desplazables */}
      <nav aria-label="Secciones de configuración" className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 lg:hidden">
        <div className="flex w-max gap-2">
          {item(ROUTES.app.settings, 'Resumen', LayoutGrid, active === null, false, true)}
          {SETTINGS_SECTIONS.map((s) => item(ROUTES.app.settingsSection(s.slug), s.label, s.icon, active === s.slug, attention.has(s.slug), true))}
        </div>
      </nav>

      {/* Escritorio: navegación lateral */}
      <nav aria-label="Secciones de configuración" className="sticky top-20 hidden space-y-5 self-start lg:block">
        {item(ROUTES.app.settings, 'Resumen', LayoutGrid, active === null, false, false)}
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{g}</p>
            <div className="space-y-0.5">
              {SETTINGS_SECTIONS.filter((s) => s.group === g).map((s) =>
                item(ROUTES.app.settingsSection(s.slug), s.label, s.icon, active === s.slug, attention.has(s.slug), false),
              )}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
