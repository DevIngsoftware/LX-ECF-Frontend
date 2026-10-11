import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DEVELOPER_SECTIONS, type DeveloperSlug } from '@/app/layouts/navigation';
import { ROUTES } from '@/constants/routes';

export function SectionPager({ slug }: { slug: DeveloperSlug }) {
  const idx = DEVELOPER_SECTIONS.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? DEVELOPER_SECTIONS[idx - 1] : undefined;
  const next = idx >= 0 && idx < DEVELOPER_SECTIONS.length - 1 ? DEVELOPER_SECTIONS[idx + 1] : undefined;

  return (
    <nav aria-label="Navegación entre secciones" className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <Link to={ROUTES.developers.section(prev.slug)} className="surface surface-hover group flex items-center gap-3 p-4">
          <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Anterior</p>
            <p className="truncate font-medium">{prev.label}</p>
          </div>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link to={ROUTES.developers.section(next.slug)} className="surface surface-hover group flex items-center justify-end gap-3 p-4 text-right">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Siguiente</p>
            <p className="truncate font-medium">{next.label}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
