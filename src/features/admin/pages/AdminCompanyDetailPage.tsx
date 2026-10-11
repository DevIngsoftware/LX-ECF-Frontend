import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Ban, CalendarDays, FileText, Info, Play, Users } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { formatDate, formatNumber } from '@/utils/format';
import { MODULE_LABELS } from '../components/admin-meta';
import { CompanySubscriptionCard } from '../components/CompanySubscriptionCard';
import { CompanyCertificationCard } from '../components/CompanyCertificationCard';
import { CompanyEnvironmentCard } from '../components/CompanyEnvironmentCard';
import { useAuth } from '@/features/auth/auth-context';

export function AdminCompanyDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<'SUSPENDIDA' | 'ACTIVA' | null>(null);
  const { data: company, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.company(id),
    queryFn: () => adminService.company(id),
    enabled: !!id,
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => adminService.setCompanyStatus(id, status),
    onSuccess: (_, status) => {
      toast.success(status === 'SUSPENDIDA' ? 'Empresa suspendida' : 'Empresa reactivada');
      void qc.invalidateQueries({ queryKey: queryKeys.admin.company(id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      setConfirm(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const back = (
    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
      <Link to={ROUTES.admin.companies}>
        <ArrowLeft /> Empresas
      </Link>
    </Button>
  );

  if (isLoading) return <PageTransition>{back}<LoadingState rows={6} /></PageTransition>;
  if (error || !company) return <PageTransition>{back}<div className="surface"><ErrorState error={error} onRetry={() => void refetch()} /></div></PageTransition>;

  const suspended = company.status === 'SUSPENDIDA';

  return (
    <PageTransition>
      {back}
      <PageHeader
        eyebrow="Empresa"
        title={company.name}
        description={<span className="font-mono">RNC {company.rnc}</span>}
        actions={
          <>
            <GenericStatusBadge status={company.status} />
            {suspended ? (
              <Button onClick={() => setConfirm('ACTIVA')}>
                <Play /> Reactivar
              </Button>
            ) : (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirm('SUSPENDIDA')}>
                <Ban /> Suspender
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Documentos del mes" value={formatNumber(company.documentsThisMonth)} icon={FileText} tone="brand" />
        <StatCard index={1} label="Usuarios" value={formatNumber(company.users)} icon={Users} tone="info" />
        <StatCard index={2} label="Cliente desde" value={formatDate(company.createdAt)} icon={CalendarDays} tone="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="profile-title">
          <h2 id="profile-title" className="mb-4 font-semibold">Perfil</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Razón social</dt>
              <dd className="mt-0.5 font-medium">{company.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">RNC</dt>
              <dd className="mt-0.5 font-mono">{company.rnc}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Plan</dt>
              <dd className="mt-0.5 font-medium">{company.plan}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="mt-0.5"><GenericStatusBadge status={company.status} /></dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Módulos activos</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {company.modules.length ? company.modules.map((m) => <Badge key={m} variant="neutral">{MODULE_LABELS[m] ?? m}</Badge>) : <span className="text-muted-foreground">Ninguno</span>}
              </dd>
            </div>
          </dl>
        </section>

        <CompanySubscriptionCard company={company} />

        {user?.role === 'SUPERADMIN' && <CompanyEnvironmentCard key={company.id} company={company} />}
        {user?.role === 'SUPERADMIN' && <CompanyCertificationCard companyId={id} />}

        <section className="surface p-5 lg:col-span-2" aria-labelledby="users-title">
          <h2 id="users-title" className="mb-2 font-semibold">Usuarios de la empresa</h2>
          <p className="text-sm">
            <span className="font-semibold tabular-nums">{formatNumber(company.users)}</span> usuario(s) registrados.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            El detalle de usuarios por empresa estará disponible cuando el servicio lo exponga. La gestión de usuarios la realiza cada empresa desde su portal.
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && !setStatus.isPending && setConfirm(null)}
        title={confirm === 'SUSPENDIDA' ? 'Suspender empresa' : 'Reactivar empresa'}
        description={
          confirm === 'SUSPENDIDA'
            ? `Los usuarios de ${company.name} no podrán emitir comprobantes ni usar la API mientras la empresa esté suspendida.`
            : `${company.name} recuperará el acceso a la plataforma y conservará su estado de configuración previo.`
        }
        confirmLabel={confirm === 'SUSPENDIDA' ? 'Suspender' : 'Reactivar'}
        destructive={confirm === 'SUSPENDIDA'}
        loading={setStatus.isPending}
        onConfirm={() => confirm && setStatus.mutate(confirm)}
      />
    </PageTransition>
  );
}
