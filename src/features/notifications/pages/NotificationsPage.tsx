import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { BellOff, CheckCheck, Check, ChevronDown } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { errorMessage } from '@/services/http/errors';
import type { AppNotification } from '@/types/account';
import type { Severity } from '@/types/common';
import { NotificationItem } from '../components/NotificationItem';
import { useNotifications } from '../hooks/use-notifications';

const PAGE_SIZE = 10;

const SEVERITY_LABELS: Record<Severity, string> = { error: 'Crítica', warning: 'Advertencia', info: 'Información', success: 'Éxito' };

const CATEGORY_LABELS: Record<string, string> = {
  DGII: 'DGII',
  CERTIFICADO: 'Certificado',
  SECUENCIAS: 'Secuencias',
  SUSCRIPCION: 'Suscripción',
  SEGURIDAD: 'Seguridad',
  ADMIN: 'Plataforma',
};

type ReadFilter = 'all' | 'unread';

export function NotificationsPage() {
  const { user } = useAuth();
  const portal = user?.portal ?? 'tenant';
  const { data, isLoading, error, refetch, unread, markRead, markAllRead } = useNotifications();
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [severity, setSeverity] = useState<string>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Solo se permite navegar a enlaces del portal actual (las alertas de empresa apuntan a /app).
  const linkPrefix = portal === 'admin' ? ROUTES.admin.root : ROUTES.app.root;
  const settingsLink = portal === 'admin' ? ROUTES.admin.settings : ROUTES.app.settings;

  const categories = useMemo(() => Array.from(new Set((data ?? []).map((n) => n.category))), [data]);
  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter((n) => readFilter === 'all' || !n.read)
        .filter((n) => severity === 'ALL' || n.severity === severity)
        .filter((n) => category === 'ALL' || n.category === category)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data, readFilter, severity, category],
  );
  const shown = filtered.slice(0, visibleCount);
  const hasFilters = readFilter !== 'all' || severity !== 'ALL' || category !== 'ALL';

  const resetPaging = () => setVisibleCount(PAGE_SIZE);
  const clearFilters = () => {
    setReadFilter('all');
    setSeverity('ALL');
    setCategory('ALL');
    resetPaging();
  };

  const scopedLink = (n: AppNotification): AppNotification =>
    n.link && (n.link === linkPrefix || n.link.startsWith(`${linkPrefix}/`)) ? n : { ...n, link: undefined };

  const onMarkAll = () =>
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success('Todas las notificaciones se marcaron como leídas'),
      onError: (err) => toast.error(errorMessage(err)),
    });
  const onMarkOne = (id: string) => markRead.mutate(id, { onError: (err) => toast.error(errorMessage(err)) });

  return (
    <PageTransition>
      <PageHeader
        eyebrow={portal === 'admin' ? 'Administración' : 'Cuenta'}
        title="Notificaciones"
        description={unread ? `Tienes ${unread} notificación(es) sin leer.` : 'Alertas sobre DGII, certificados, secuencias, suscripción y seguridad.'}
        actions={
          <>
            <Button asChild variant="outline"><Link to={settingsLink}>Configuración</Link></Button>
            <Button onClick={onMarkAll} disabled={!unread || markAllRead.isPending}><CheckCheck /> Marcar todas como leídas</Button>
          </>
        }
      />

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={readFilter} onValueChange={(v) => { setReadFilter(v as ReadFilter); resetPaging(); }}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="gap-1.5">
                No leídas
                {unread > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">{unread}</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={severity} onValueChange={(v) => { setSeverity(v); resetPaging(); }}>
              <SelectTrigger className="h-10 sm:w-44" aria-label="Filtrar por severidad"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toda severidad</SelectItem>
                {(Object.keys(SEVERITY_LABELS) as Severity[]).map((s) => <SelectItem key={s} value={s}>{SEVERITY_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); resetPaging(); }}>
              <SelectTrigger className="h-10 sm:w-44" aria-label="Filtrar por categoría"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toda categoría</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4"><LoadingState rows={6} className="[&>*]:h-16" /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={hasFilters ? 'Sin resultados' : 'Sin notificaciones'}
            description={hasFilters ? 'No hay notificaciones que coincidan con los filtros seleccionados.' : 'Te avisaremos cuando ocurra algo importante.'}
            action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button> : undefined}
          />
        ) : (
          <>
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {shown.map((n) => (
                  <motion.li key={n.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="group relative">
                    <div className="flex items-stretch">
                      <div className="min-w-0 flex-1">
                        <NotificationItem notification={scopedLink(n)} onRead={() => onMarkOne(n.id)} />
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center gap-1 pr-4">
                        <span className="hidden rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">{CATEGORY_LABELS[n.category] ?? n.category}</span>
                        {!n.read && (
                          <Button variant="ghost" size="xs" onClick={() => onMarkOne(n.id)} disabled={markRead.isPending} aria-label={`Marcar como leída: ${n.title}`}>
                            <Check /> <span className="hidden sm:inline">Marcar leída</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex flex-col items-center gap-2 border-t p-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
              <span>Mostrando {shown.length} de {filtered.length}</span>
              {shown.length < filtered.length && (
                <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}><ChevronDown /> Cargar más</Button>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
