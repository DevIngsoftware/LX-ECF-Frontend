import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Link2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MODIFICATION_CODES } from '@/constants/ecf';
import { ROUTES } from '@/constants/routes';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import type { InvoiceReference } from '@/types/ecf';
import { formatDate } from '@/utils/format';

/** Comprobante modificado por una nota de crédito o débito, con enlace si existe en el sistema. */
export function ReferenceCard({ reference }: { reference: InvoiceReference }) {
  const query = { page: 0, size: 5, search: reference.modifiedNcf };
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.invoices(query),
    queryFn: () => invoicesService.list(query),
    staleTime: 60_000,
  });
  const original = data?.content.find((i) => i.encf === reference.modifiedNcf);
  const code = MODIFICATION_CODES.find((c) => c.value === reference.modificationCode)?.label ?? reference.modificationCode;

  return (
    <section className="surface p-5" aria-labelledby="ref-title">
      <h2 id="ref-title" className="mb-3 flex items-center gap-2 font-semibold">
        <Link2 className="h-4 w-4 text-brand" aria-hidden /> Comprobante modificado
      </h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">e-NCF modificado</dt>
          <dd className="font-mono font-semibold">
            {isLoading ? (
              <Skeleton className="h-5 w-36" />
            ) : original ? (
              <Link to={ROUTES.app.invoice(original.id)} className="inline-flex items-center gap-1 hover:text-brand hover:underline">
                {reference.modifiedNcf} <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              reference.modifiedNcf
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fecha del comprobante modificado</dt>
          <dd>{formatDate(reference.modifiedDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Código de modificación</dt>
          <dd>{code}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Razón</dt>
          <dd>{reference.reason}</dd>
        </div>
      </dl>
    </section>
  );
}
