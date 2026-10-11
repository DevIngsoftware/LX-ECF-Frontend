import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { EmptyState } from '@/components/shared/states';
import { DgiiStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import { ROUTES } from '@/constants/routes';
import type { PartyKind } from '@/types/business';
import type { Page } from '@/types/common';
import type { InvoiceSummary } from '@/types/ecf';
import { formatDate, formatMoney } from '@/utils/format';

interface PartyHistoryTableProps {
  kind: PartyKind;
  items?: InvoiceSummary[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

export function PartyHistoryTable({ kind, items, isLoading, error, onRetry }: PartyHistoryTableProps) {
  const navigate = useNavigate();
  const isCustomer = kind === 'customers';

  const page = useMemo<Page<InvoiceSummary> | undefined>(
    () => (items ? { content: items, page: 0, size: Math.max(items.length, 1), totalElements: items.length, totalPages: 1 } : undefined),
    [items],
  );

  const columns = useMemo<ColumnDef<InvoiceSummary, unknown>[]>(
    () => [
      {
        id: 'encf',
        header: 'e-NCF',
        cell: ({ row }) =>
          isCustomer ? (
            <Link to={ROUTES.app.invoice(row.original.id)} onClick={(e) => e.stopPropagation()} className="font-mono text-xs font-medium hover:text-brand hover:underline">
              {row.original.encf}
            </Link>
          ) : (
            <span className="font-mono text-xs">{row.original.encf}</span>
          ),
      },
      {
        id: 'type',
        header: 'Tipo',
        cell: ({ row }) => (
          <Badge variant="neutral" title={ECF_TYPE_MAP[row.original.type]?.name}>
            {row.original.type} · {ECF_TYPE_MAP[row.original.type]?.short ?? ''}
          </Badge>
        ),
      },
      { id: 'issueDate', header: 'Fecha', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
      { id: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.total)}</span> },
      { id: 'dgii', header: 'Estado DGII', cell: ({ row }) => <DgiiStatusBadge status={row.original.dgiiStatus} /> },
      { id: 'payment', header: 'Estado de pago', cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} /> },
    ],
    [isCustomer],
  );

  return (
    <DataTable
      columns={columns}
      page={page}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      getRowId={(r) => r.id}
      onRowClick={isCustomer ? (r) => navigate(ROUTES.app.invoice(r.id)) : undefined}
      toolbar={
        <div>
          <h2 className="font-semibold">{isCustomer ? 'Historial de comprobantes' : 'Historial de documentos'}</h2>
          <p className="text-xs text-muted-foreground">Últimos movimientos registrados. El estado fiscal y el estado de pago se muestran por separado.</p>
        </div>
      }
      empty={
        <EmptyState
          compact
          icon={FileText}
          title="Sin documentos"
          description={isCustomer ? 'Aún no has emitido comprobantes a este cliente.' : 'No hay documentos asociados a este proveedor.'}
        />
      }
    />
  );
}
