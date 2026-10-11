import { motion } from 'framer-motion';
import { Box, ChevronLeft, ChevronRight, Pencil, Power, Wrench } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/components/animations/motion';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types/business';
import type { Page } from '@/types/common';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  page?: Page<Product>;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  pageIndex: number;
  onPageChange: (p: number) => void;
  canWrite: boolean;
  onEdit: (p: Product) => void;
  onToggle: (p: Product) => void;
}

export function ProductGrid({ page, isLoading, error, onRetry, pageIndex, onPageChange, canWrite, onEdit, onToggle }: ProductGridProps) {
  if (error) return <div className="surface"><ErrorState error={error} onRetry={onRetry} /></div>;
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }
  if (!page || page.content.length === 0) {
    return <div className="surface"><EmptyState compact title="Sin resultados" description="No hay artículos que coincidan con los filtros." /></div>;
  }

  return (
    <div className="space-y-4">
      <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {page.content.map((p) => {
          const Icon = p.kind === 'SERVICIO' ? Wrench : Box;
          return (
            <motion.li key={p.id} variants={staggerItem} className={cn('surface surface-hover flex flex-col p-5', !p.active && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', p.kind === 'SERVICIO' ? 'bg-info-soft text-info' : 'bg-brand-soft text-brand')}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <StatusBadge label={p.active ? 'Activo' : 'Inactivo'} tone={p.active ? 'success' : 'neutral'} />
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">{p.code}</p>
              <h3 className="line-clamp-2 font-semibold">{p.name}</h3>
              {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
              <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                <div>
                  <p className="font-display text-lg font-bold tabular-nums">{formatMoney(p.price)}</p>
                  <p className="text-xs text-muted-foreground">{p.itbisRate === 0 ? 'Exento de ITBIS' : `ITBIS ${p.itbisRate}%`}</p>
                </div>
                {canWrite && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(p)} aria-label={`Editar ${p.name}`}><Pencil /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => onToggle(p)} aria-label={p.active ? `Desactivar ${p.name}` : `Reactivar ${p.name}`}><Power /></Button>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
      <div className="flex items-center justify-end gap-2 text-sm">
        <Button variant="outline" size="sm" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex === 0} aria-label="Página anterior"><ChevronLeft /></Button>
        <span className="tabular-nums text-muted-foreground">{pageIndex + 1} / {page.totalPages || 1}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(pageIndex + 1)} disabled={pageIndex + 1 >= page.totalPages} aria-label="Página siguiente"><ChevronRight /></Button>
      </div>
    </div>
  );
}
