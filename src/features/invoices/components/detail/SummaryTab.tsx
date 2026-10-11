import type { ReactNode } from 'react';
import { Building2, CreditCard, UserRound } from 'lucide-react';
import { INCOME_TYPES, PAYMENT_TYPES } from '@/constants/ecf';
import { useAuth } from '@/features/auth/auth-context';
import type { InvoiceDetail } from '@/types/ecf';
import { formatDateTime } from '@/utils/format';
import { ItemsTable } from '../ItemsTable';
import { TotalsList } from '../TotalsList';
import { detailTotals } from '../../lib/invoice-math';
import { ReferenceCard } from './ReferenceCard';

function InfoCard({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: ReactNode }) {
  return (
    <section className="surface p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-brand" aria-hidden /> {title}
      </h2>
      <dl className="space-y-2 text-sm">{children}</dl>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'text-right font-mono text-xs' : 'text-right'}>{value || '—'}</dd>
    </div>
  );
}

export function SummaryTab({ invoice }: { invoice: InvoiceDetail }) {
  const { user } = useAuth();
  const income = INCOME_TYPES.find((t) => t.value === invoice.incomeType)?.label ?? invoice.incomeType;
  const payment = PAYMENT_TYPES.find((t) => t.value === invoice.paymentType)?.label ?? invoice.paymentType;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={Building2} title="Emisor">
          <Field label="Razón social" value={user?.tenant?.name} />
          <Field label="RNC" value={user?.tenant?.rnc} mono />
        </InfoCard>
        <InfoCard icon={UserRound} title="Comprador">
          <Field label="Nombre" value={invoice.buyer.name ?? invoice.buyerName} />
          <Field label="RNC / Cédula" value={invoice.buyer.rnc ?? invoice.buyerRnc} mono />
          {invoice.buyer.foreignId && <Field label="Identificación extranjera" value={invoice.buyer.foreignId} mono />}
          {invoice.buyer.country && <Field label="País" value={invoice.buyer.country} />}
          <Field label="Correo" value={invoice.buyer.email} />
        </InfoCard>
        <InfoCard icon={CreditCard} title="Condiciones">
          <Field label="Tipo de ingreso" value={income} />
          <Field label="Forma de pago" value={payment} />
          {invoice.paymentType === '2' && <Field label="Plazo" value={invoice.paymentTermDays ? `${invoice.paymentTermDays} días` : undefined} />}
          <Field label="Firmado" value={invoice.signedAt ? formatDateTime(invoice.signedAt) : 'Pendiente'} />
        </InfoCard>
      </div>

      {invoice.reference && <ReferenceCard reference={invoice.reference} />}

      <section className="surface overflow-hidden" aria-labelledby="items-title">
        <div className="border-b px-5 py-4">
          <h2 id="items-title" className="font-semibold">Artículos</h2>
          <p className="text-xs text-muted-foreground">{invoice.items.length} línea(s)</p>
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <ItemsTable items={invoice.items} />
          <div className="rounded-xl bg-muted/40 p-4">
            <TotalsList values={detailTotals(invoice)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Monto facturado. El cobro se gestiona por separado en Cuentas por cobrar.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
