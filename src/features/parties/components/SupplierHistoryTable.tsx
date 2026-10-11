import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { EmptyState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { ECF_TYPE_MAP } from '@/constants/ecf';
import type { ReceivedDocument } from '@/types/business';
import type { Page } from '@/types/common';
import { formatDate, formatMoney } from '@/utils/format';
import { receptionStatusMeta } from '@/features/reception/components/reception-meta';

interface Props {
  items?: ReceivedDocument[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

export function SupplierHistoryTable({ items, isLoading, error, onRetry }: Props) {
  const page = useMemo<Page<ReceivedDocument> | undefined>(
    () => items ? { content: items, page: 0, size: Math.max(items.length, 1), totalElements: items.length, totalPages: 1 } : undefined,
    [items],
  );
  const columns = useMemo<ColumnDef<ReceivedDocument, unknown>[]>(() => [
    { id: 'encf', header: 'e-NCF', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.encf}</span> },
    { id: 'type', header: 'Tipo', cell: ({ row }) => <Badge variant="neutral" title={ECF_TYPE_MAP[row.original.type]?.name}>{row.original.type}</Badge> },
    { id: 'issueDate', header: 'Fecha', cell: ({ row }) => formatDate(row.original.issueDate) },
    { id: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.total)}</span> },
    { id: 'status', header: 'Recepción', cell: ({ row }) => {
      const meta = receptionStatusMeta(row.original.status);
      return <StatusBadge label={meta.label} tone={meta.tone} />;
    } },
  ], []);

  return <DataTable columns={columns} page={page} isLoading={isLoading} error={error} onRetry={onRetry}
    getRowId={(row) => row.id}
    toolbar={<div><h2 className="font-semibold">Comprobantes recibidos</h2><p className="text-xs text-muted-foreground">Últimos documentos de este proveedor recibidos por tu empresa.</p></div>}
    empty={<EmptyState compact icon={FileText} title="Sin documentos" description="No hay comprobantes recibidos de este proveedor." />} />;
}
