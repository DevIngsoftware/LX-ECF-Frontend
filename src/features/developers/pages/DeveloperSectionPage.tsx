import type { ComponentType } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageTransition } from '@/components/animations/motion';
import { DEVELOPER_SECTIONS, type DeveloperSlug } from '@/app/layouts/navigation';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { SectionPager } from '../components/SectionPager';
import { SignInCard } from '../components/SignInCard';
import { IntroSection } from '../sections/IntroSection';
import { GettingStartedSection } from '../sections/GettingStartedSection';
import { AuthSection } from '../sections/AuthSection';
import { EnvironmentsSection } from '../sections/EnvironmentsSection';
import { ReferenceSection } from '../sections/ReferenceSection';
import { ExamplesSection } from '../sections/ExamplesSection';
import { ResponsesSection } from '../sections/ResponsesSection';
import { ErrorsSection } from '../sections/ErrorsSection';
import { CredentialsSection } from '../sections/CredentialsSection';
import { UsageSection } from '../sections/UsageSection';
import { HistorySection } from '../sections/HistorySection';
import { SupportSection } from '../sections/SupportSection';

const SECTIONS: Record<DeveloperSlug, ComponentType> = {
  introduccion: IntroSection,
  'primeros-pasos': GettingStartedSection,
  autenticacion: AuthSection,
  ambientes: EnvironmentsSection,
  documentacion: ReferenceSection,
  ejemplos: ExamplesSection,
  respuestas: ResponsesSection,
  errores: ErrorsSection,
  credenciales: CredentialsSection,
  consumo: UsageSection,
  historial: HistorySection,
  soporte: SupportSection,
};

const PRIVATE: ReadonlySet<DeveloperSlug> = new Set<DeveloperSlug>(['credenciales', 'consumo', 'historial']);

const isSlug = (s: string | undefined): s is DeveloperSlug => !!s && DEVELOPER_SECTIONS.some((x) => x.slug === s);

export function DeveloperSectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  if (!isSlug(slug)) return <Navigate to={ROUTES.developers.section('introduccion')} replace />;

  const Section = SECTIONS[slug];
  const meta = DEVELOPER_SECTIONS.find((s) => s.slug === slug);
  const locked = PRIVATE.has(slug) && user?.portal !== 'tenant';

  return (
    <PageTransition key={slug}>
      <article className="mx-auto w-full max-w-4xl">
        {locked ? (
          <div className="py-8">
            <SignInCard title={`${meta?.label ?? 'Esta sección'} requiere una cuenta de empresa`} isAdmin={user?.portal === 'admin'} />
          </div>
        ) : (
          <Section />
        )}
        <SectionPager slug={slug} />
      </article>
    </PageTransition>
  );
}
