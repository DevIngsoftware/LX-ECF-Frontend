import { CalendarClock, CalendarDays, Check, FileText, Users } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Subscription } from '@/types/account';
import { daysUntil, formatDate } from '@/utils/format';
import { MODULE_LABELS, SUBSCRIPTION_STATUS } from './subscription-utils';
import { UsageMeter } from './UsageMeter';

export function CurrentPlanCard({ sub }: { sub: Subscription }) {
  const status = SUBSCRIPTION_STATUS[sub.status] ?? { label: sub.status, tone: 'neutral' as const };
  const days = daysUntil(sub.renewalDate);

  return (
    <section className="surface overflow-hidden">
      <div className="relative border-b bg-gradient-to-br from-brand-soft/60 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">Plan actual</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{sub.planName}</h2>
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:text-right">
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground sm:justify-end"><CalendarDays className="h-3.5 w-3.5" /> Inicio</dt>
              <dd className="font-medium">{formatDate(sub.startedAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-muted-foreground sm:justify-end"><CalendarClock className="h-3.5 w-3.5" /> {sub.status === 'PRUEBA' ? 'Fin de prueba' : 'Renovación'}</dt>
              <dd className="font-medium">{formatDate(sub.renewalDate)}</dd>
              <dd className={days <= 7 ? 'text-xs text-warning' : 'text-xs text-muted-foreground'}>
                {days > 0 ? `En ${days} día(s)` : days === 0 ? 'Hoy' : `Hace ${Math.abs(days)} día(s)`}
              </dd>
            </div>
          </dl>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Vigencia pagada: {formatDate(sub.startedAt)} – {formatDate(sub.renewalDate)}. El cupo de comprobantes se renueva cada mes.
        </p>
        {sub.status === 'VENCIDA' && days < 0 && <p className="mt-2 text-sm font-medium text-warning">
          {days >= -5
            ? days === -5 ? 'Último día de gracia para crear nuevos comprobantes. Renueva hoy.'
              : `Plan vencido. Puedes crear comprobantes durante ${5 + days} día(s) más; renueva para evitar la interrupción.`
            : 'Plan vencido. Renueva para crear nuevos comprobantes.'}
        </p>}
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Uso del período</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <UsageMeter label="Comprobantes este mes" icon={FileText} used={sub.documentsUsed} limit={sub.documentsLimit} unit="comprobantes" />
            <UsageMeter label="Usuarios" icon={Users} used={sub.usersUsed} limit={sub.usersLimit} unit="usuarios" />
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Módulos incluidos</h3>
          {sub.modules.length ? (
            <ul className="space-y-2">
              {sub.modules.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-3 w-3" /></span>
                  {MODULE_LABELS[m] ?? m}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tu plan incluye solo las funciones base de facturación.</p>
          )}
        </div>
      </div>
    </section>
  );
}
