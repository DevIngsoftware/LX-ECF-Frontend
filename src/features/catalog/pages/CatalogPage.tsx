import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Box, LayoutGrid, List, Pencil, Plus, Power, Wrench } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/forms/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/features/auth/auth-context';
import { useTableQuery } from '@/hooks/use-table-query';
import { catalogService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Product } from '@/types/business';
import { formatMoney } from '@/utils/format';
import { ProductFormDialog } from '../components/ProductFormDialog';
import { ProductGrid } from '../components/ProductGrid';

type View = 'table' | 'grid';
type KindFilter = 'ALL' | 'BIEN' | 'SERVICIO';
type ActiveFilter = 'all' | 'active' | 'inactive';

export function CatalogPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('catalog.write');
  const t = useTableQuery({ size: 12, sort: [{ id: 'name', desc: false }] });
  const [view, setView] = useState<View>('table');
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [active, setActive] = useState<ActiveFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toggling, setToggling] = useState<Product | null>(null);

  const query = { ...t.query, kind, active };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.catalog(query),
    queryFn: () => catalogService.list(query),
    placeholderData: keepPreviousData,
  });

  const toggle = useMutation({
    mutationFn: (p: Product) => catalogService.setActive(p.id, !p.active),
    onSuccess: (_, p) => {
      toast.success(p.active ? 'Artículo desactivado' : 'Artículo reactivado');
      void qc.invalidateQueries({ queryKey: ['catalog'] });
      setToggling(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const openEdit = (p: Product | null) => {
    setEditing(p);
    setFormOpen(true);
  };

  const columns = useMemo<ColumnDef<Product, unknown>[]>(() => {
    const cols: ColumnDef<Product, unknown>[] = [
      { id: 'code', accessorKey: 'code', header: 'Código', cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="max-w-[280px] truncate font-medium">{row.original.name}</p>
            {row.original.description && <p className="max-w-[280px] truncate text-xs text-muted-foreground">{row.original.description}</p>}
          </div>
        ),
      },
      {
        id: 'kind',
        accessorKey: 'kind',
        header: 'Tipo',
        cell: ({ row }) =>
          row.original.kind === 'SERVICIO' ? (
            <span className="inline-flex items-center gap-1.5 text-sm"><Wrench className="h-3.5 w-3.5 text-info" /> Servicio</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm"><Box className="h-3.5 w-3.5 text-brand" /> Bien</span>
          ),
      },
      { id: 'category', accessorKey: 'category', header: 'Categoría', cell: ({ row }) => <span className="text-muted-foreground">{row.original.category ?? '—'}</span> },
      { id: 'price', accessorKey: 'price', header: 'Precio', cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.price)}</span> },
      { id: 'itbisRate', accessorKey: 'itbisRate', header: 'ITBIS', cell: ({ row }) => <span className="tabular-nums">{row.original.itbisRate === 0 ? 'Exento' : `${row.original.itbisRate}%`}</span> },
      {
        id: 'active',
        header: 'Estado',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge label={row.original.active ? 'Activo' : 'Inactivo'} tone={row.original.active ? 'success' : 'neutral'} />,
      },
    ];
    if (canWrite) {
      cols.push({
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)} aria-label={`Editar ${row.original.name}`}><Pencil /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setToggling(row.original)} aria-label={row.original.active ? 'Desactivar' : 'Reactivar'}><Power /></Button>
          </div>
        ),
      });
    }
    return cols;
  }, [canWrite]);

  const toolbar = (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <SearchInput value={t.search} onChange={t.setSearch} placeholder="Buscar por código, nombre o categoría" />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Select value={kind} onValueChange={(v) => { setKind(v as KindFilter); t.resetPage(); }}>
          <SelectTrigger className="h-10 sm:w-40" aria-label="Filtrar por tipo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value="BIEN">Bienes</SelectItem>
            <SelectItem value="SERVICIO">Servicios</SelectItem>
          </SelectContent>
        </Select>
        <Select value={active} onValueChange={(v) => { setActive(v as ActiveFilter); t.resetPage(); }}>
          <SelectTrigger className="h-10 sm:w-40" aria-label="Filtrar por estado"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Módulo"
        title="Catálogo"
        description="Productos y servicios con precio e ITBIS predefinidos para emitir más rápido."
        actions={
          <>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} className="rounded-lg border bg-card p-1" aria-label="Vista">
              <ToggleGroupItem value="table" className="h-8 w-8 p-0 data-[state=on]:bg-foreground data-[state=on]:text-background" aria-label="Vista de tabla"><List className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="grid" className="h-8 w-8 p-0 data-[state=on]:bg-foreground data-[state=on]:text-background" aria-label="Vista de cuadrícula"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
            {canWrite && <Button onClick={() => openEdit(null)}><Plus /> Nuevo artículo</Button>}
          </>
        }
      />

      {view === 'table' ? (
        <DataTable
          columns={columns}
          page={data}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          pageIndex={t.pageIndex}
          onPageChange={t.setPageIndex}
          sorting={t.sorting}
          onSortingChange={t.setSorting}
          getRowId={(r) => r.id}
          onRowClick={canWrite ? (r) => openEdit(r) : undefined}
          toolbar={toolbar}
        />
      ) : (
        <div className="space-y-4">
          <div className="surface p-4">{toolbar}</div>
          <ProductGrid
            page={data}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            pageIndex={t.pageIndex}
            onPageChange={t.setPageIndex}
            canWrite={canWrite}
            onEdit={openEdit}
            onToggle={setToggling}
          />
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && !toggle.isPending && setToggling(null)}
        title={toggling?.active ? 'Desactivar artículo' : 'Reactivar artículo'}
        description={
          toggling?.active
            ? `"${toggling.name}" dejará de aparecer al emitir comprobantes. Los comprobantes ya emitidos no se modifican.`
            : `"${toggling?.name ?? ''}" volverá a estar disponible al emitir comprobantes.`
        }
        confirmLabel={toggling?.active ? 'Desactivar' : 'Reactivar'}
        destructive={!!toggling?.active}
        loading={toggle.isPending}
        onConfirm={() => toggling && toggle.mutate(toggling)}
      />
    </PageTransition>
  );
}
