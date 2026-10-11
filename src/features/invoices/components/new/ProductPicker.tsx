import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { catalogService } from '@/services/api/operations';
import { errorMessage } from '@/services/http/errors';
import type { Product } from '@/types/business';
import { formatMoney } from '@/utils/format';

export function ProductPicker({ onSelect }: { onSelect: (product: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const query = useQuery({
    queryKey: ['catalog', 'invoice-picker', debounced],
    queryFn: () => catalogService.list({ page: 0, size: 12, search: debounced || undefined,
      active: 'active', sort: 'name', direction: 'asc' }),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" aria-expanded={open}>
          <PackageSearch /> Elegir del catálogo <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,420px)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Buscar por código o nombre…" />
          <CommandList>
            {query.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</div>
            ) : query.error ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">{errorMessage(query.error)}</p>
            ) : (
              <>
                <CommandEmpty>No hay artículos activos que coincidan.</CommandEmpty>
                <CommandGroup>
                  {query.data?.content.map((product) => (
                    <CommandItem key={product.id} value={product.id} onSelect={() => { onSelect(product); setOpen(false); }}>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.code} · {formatMoney(product.price)} · ITBIS {product.itbisRate}%</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
