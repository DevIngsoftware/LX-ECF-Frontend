import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CalendarDays, FilePlus2, FileText, Mail, MapPin, Pencil, Phone, Power, Receipt, StickyNote, Wallet, type LucideIcon,
} from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { CopyButton } from '@/components/shared/CopyButton';
import { StatCard } from '@/components/shared/StatCard';
import { ErrorState, LoadingState, ModuleNotContracted } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/auth-context';
import { partiesService, receptionService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import type { PartyKind, ReceivedDocument } from '@/types/business';
import type { InvoiceSummary } from '@/types/ecf';
import { formatDate, formatMoney, formatNumber, initials } from '@/utils/format';
import { PARTY_META, formatRnc } from '../components/party-meta';
import { PartyFormSheet } from '../components/PartyFormSheet';
import { PartyActiveConfirm } from '../components/PartyActiveConfirm';
import { PartyStatusBadge } from '../components/PartyStatusBadge';
import { PartyHistoryTable } from '../components/PartyHistoryTable';
import { SupplierHistoryTable } from '../components/SupplierHistoryTable';

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="break-words text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export function PartyDetailPage({ kind }: { kind: PartyKind }) {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meta = PARTY_META[kind];
  const { hasPermission, hasModule } = useAuth();
  const canWrite = hasPermission('parties.write');
  const canEmit = kind === 'customers' && hasPermission('invoices.emit');
  const [editOpen, setEditOpen] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);

  const party = useQuery({ queryKey: queryKeys.party(kind, id), queryFn: () => partiesService.get(kind, id), enabled: !!id });
  const canReadReception = hasModule('reception');
  const history = useQuery<InvoiceSummary[] | ReceivedDocument[]>({ queryKey: queryKeys.partyHistory(kind, id),
    queryFn: async () => kind === 'customers' ? partiesService.history(kind, id) : receptionService.supplierHistory(id),
    enabled: !!id && (kind === 'customers' || canReadReception) });

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground">
      <Link to={meta.listRoute}>
        <ArrowLeft /> {meta.title}
      </Link>
    </Button>
  );

  if (party.isLoading) {
    return (
      <div>
        {back}
        <LoadingState rows={6} />
      </div>
    );
  }
  if (party.error || !party.data) {
    return (
      <div>
        {back}
        <ErrorState error={party.error} onRetry={() => void party.refetch()} />
      </div>
    );
  }

  const p = party.data;
  const docs = history.data ?? [];
  const lastDoc = docs.reduce<string | undefined>((max, d) => (!max || d.issueDate > max ? d.issueDate : max), undefined);

  return (
    <PageTransition>
      {back}

      <div className="surface mb-6 overflow-hidden">
        <div className="h-1 bg-brand" aria-hidden />
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-lg font-bold text-brand">
              {initials(p.tradeName ?? p.legalName)}
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold sm:text-2xl">{p.legalName}</h1>
                <PartyStatusBadge active={p.active} />
              </div>
              {p.tradeName && <p className="text-sm text-muted-foreground">{p.tradeName}</p>}
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">{meta.singularCap} · RNC/Cédula</span>
                <span className="font-mono font-medium">{formatRnc(p.rnc)}</span>
                <CopyButton value={p.rnc} label="Copiar RNC" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <>
                <Button variant="outline" onClick={() => setToggleOpen(true)}>
                  <Power /> {p.active ? 'Desactivar' : 'Reactivar'}
                </Button>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil /> Editar
                </Button>
              </>
            )}
            {canEmit && p.active && (
              <Button asChild>
                <Link to={ROUTES.app.newInvoice} state={{ customerId: p.id, customerRnc: p.rnc }}>
                  <FilePlus2 /> Nueva factura
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label={meta.totalLabel} value={formatMoney(p.totalAmount ?? 0)} icon={Wallet} tone="brand" />
        <StatCard index={1} label={meta.documentsLabel} value={formatNumber(p.documentsCount ?? docs.length)} icon={Receipt} tone="info" />
        <StatCard index={2} label="Último documento" value={lastDoc ? formatDate(lastDoc) : '—'} icon={FileText} loading={history.isLoading} />
        <StatCard index={3} label={`${meta.singularCap} desde`} value={formatDate(p.createdAt)} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface space-y-5 p-6 lg:col-span-1" aria-labelledby="contact-title">
          <h2 id="contact-title" className="font-semibold">Información de contacto</h2>
          <InfoRow icon={Mail} label="Correo electrónico">
            {p.email ? <a href={`mailto:${p.email}`} className="hover:text-brand hover:underline">{p.email}</a> : '—'}
          </InfoRow>
          <InfoRow icon={Phone} label="Teléfono">
            {p.phone ? <a href={`tel:${p.phone}`} className="tabular-nums hover:text-brand hover:underline">{p.phone}</a> : '—'}
          </InfoRow>
          <InfoRow icon={MapPin} label="Dirección">{p.address ?? '—'}</InfoRow>
          {p.notes && <InfoRow icon={StickyNote} label="Notas internas">{p.notes}</InfoRow>}
        </section>
        <div className="min-w-0 lg:col-span-2">
          {kind === 'customers' ? (
            <PartyHistoryTable kind={kind} items={history.data as InvoiceSummary[] | undefined} isLoading={history.isLoading} error={history.error} onRetry={() => void history.refetch()} />
          ) : !canReadReception ? (
            <div className="surface"><ModuleNotContracted module="reception" /></div>
          ) : (
            <SupplierHistoryTable items={history.data as ReceivedDocument[] | undefined} isLoading={history.isLoading} error={history.error} onRetry={() => void history.refetch()} />
          )}
        </div>
      </div>

      <PartyFormSheet kind={kind} open={editOpen} onOpenChange={setEditOpen} party={p}
        onSaved={(saved) => { if (saved.id !== id) navigate(meta.detailRoute(saved.id), { replace: true }); }} />
      <PartyActiveConfirm kind={kind} party={toggleOpen ? p : null} onOpenChange={setToggleOpen} />
    </PageTransition>
  );
}
