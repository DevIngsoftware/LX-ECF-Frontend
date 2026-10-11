import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, CircleAlert, Settings2 } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingState, StateView } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { CompanySection } from '../components/CompanySection';
import { CertificateSection } from '../components/CertificateSection';
import { BackupSection } from '../components/BackupSection';
import { DgiiSection } from '../components/DgiiSection';
import { FiscalSection } from '../components/FiscalSection';
import { SequencesSection } from '../components/SequencesSection';
import { SettingsNav } from '../components/SettingsNav';
import { SETTINGS_SECTIONS, isSettingsSlug, sectionBySlug, type SettingsSlug } from '../components/sections';
import { SectionShell } from '../components/settings-shared';

const linkedSections: Partial<Record<SettingsSlug, { to: string; action: string; note: string }>> = {
  facturacion: { to: ROUTES.app.onboarding, action: 'Editar preferencias', note: 'Configura los valores por defecto de facturación en el asistente.' },
  usuarios: { to: ROUTES.app.users, action: 'Administrar usuarios', note: 'Gestiona el equipo y sus permisos.' },
  suscripcion: { to: ROUTES.app.subscription, action: 'Ver suscripción', note: 'Consulta tu plan y el consumo actual.' },
  integraciones: { to: ROUTES.app.integrations, action: 'Ver integraciones', note: 'Gestiona las credenciales de API.' },
};

function SettingsContent({ section }: { section: SettingsSlug | null }) {
  if (section === 'empresa') return <CompanySection />;
  if (section === 'fiscal') return <FiscalSection />;
  if (section === 'dgii') return <DgiiSection />;
  if (section === 'certificado') return <CertificateSection />;
  if (section === 'secuencias') return <SequencesSection />;
  if (section === 'respaldo') return <BackupSection />;
  if (section) {
    const item = sectionBySlug(section);
    const linked = linkedSections[section];
    return <SectionShell title={item.label} description={item.description}>
      <p className="text-sm text-muted-foreground">{linked?.note ?? 'Esta sección está preparada para la interfaz visual. Su configuración estará disponible cuando se complete este módulo.'}</p>
      {linked && <Button asChild className="mt-4" variant="outline"><Link to={linked.to}>{linked.action}<ArrowRight /></Link></Button>}
    </SectionShell>;
  }
  return <div className="grid gap-4 sm:grid-cols-2">{SETTINGS_SECTIONS.map((item) => {
    const Icon = item.icon;
    return <Link key={item.slug} to={ROUTES.app.settingsSection(item.slug)} className="surface surface-hover flex items-start gap-3 p-5">
      <span className="rounded-lg bg-brand-soft p-2 text-brand"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{item.description}</span></span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>;
  })}</div>;
}

export function SettingsPage() {
  const { section: rawSection } = useParams<{ section?: string }>();
  const status = useQuery({ queryKey: queryKeys.settingsStatus, queryFn: settingsService.status });
  const section = isSettingsSlug(rawSection) ? rawSection : null;
  const attention = new Set(SETTINGS_SECTIONS.filter((item) => item.statusKey && status.data?.some((entry) => entry.key === item.statusKey && !entry.configured)).map((item) => item.slug));

  return <PageTransition>
    <PageHeader eyebrow="Cuenta" title={section ? sectionBySlug(section).label : 'Configuración'} description={section ? sectionBySlug(section).description : 'Administra la información y las opciones de tu empresa.'} />
    {rawSection && !section ? <StateView icon={Settings2} title="Sección no encontrada" action={<Button asChild variant="outline"><Link to={ROUTES.app.settings}>Volver a configuración</Link></Button>} /> : (
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <SettingsNav active={section} attention={attention} />
        <div className="min-w-0 space-y-6">
          {!section && (status.isLoading ? <LoadingState rows={2} /> : status.error ? <ErrorState compact error={status.error} onRetry={() => void status.refetch()} /> : (
            <div className="surface p-5"><h2 className="mb-3 font-semibold">Estado de configuración</h2><ul className="grid gap-2 sm:grid-cols-2">{status.data?.map((entry) => <li key={entry.key} className="flex items-center gap-2 text-sm">{entry.configured ? <CheckCircle2 className="h-4 w-4 text-success" /> : <CircleAlert className="h-4 w-4 text-warning" />}<span>{entry.label}</span></li>)}</ul></div>
          ))}
          <SettingsContent section={section} />
        </div>
      </div>
    )}
  </PageTransition>;
}
