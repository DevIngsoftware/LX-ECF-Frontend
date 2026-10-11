import { useQuery } from '@tanstack/react-query';
import { DgiiStatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';

/**
 * El contrato de cuentas por cobrar no incluye el estado DGII, por lo que se obtiene del comprobante asociado.
 * El estado fiscal se mantiene separado del estado de pago.
 */
export function useInvoiceFiscalStatus(invoiceId: string) {
  return useQuery({
    queryKey: queryKeys.invoice(invoiceId),
    queryFn: () => invoicesService.get(invoiceId),
    staleTime: 5 * 60 * 1000,
    enabled: !!invoiceId,
  });
}

export function FiscalStatusCell({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, isError } = useInvoiceFiscalStatus(invoiceId);
  if (isLoading) return <Skeleton className="h-5 w-24" />;
  if (isError) return <span className="text-xs text-muted-foreground">No disponible</span>;
  return <DgiiStatusBadge status={data?.dgiiStatus} />;
}
