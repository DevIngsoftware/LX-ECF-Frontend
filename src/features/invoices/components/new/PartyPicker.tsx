import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { ENV } from '@/constants/env';
import { partiesService } from '@/services/api/operations';
import { invoiceCustomersService, type SavedInvoiceCustomer } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { PartyKind } from '@/types/business';

export function PartyPicker({ kind, onSelect, label }: { kind: PartyKind; onSelect: (p: SavedInvoiceCustomer) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const query = { page: 0, size: 8, search: debounced || undefined, active: 'active' as const };
  const { data, isLoading, error } = useQuery({
    queryKey: ENV.invoicesUseMocks ? queryKeys.parties(kind, query) : ['invoice-customers', query],
    queryFn: () => ENV.invoicesUseMocks ? partiesService.list(kind, query) : invoiceCustomersService.list(debounced),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between sm:w-auto" aria-expanded={open}>
          <span className="flex items-center gap-2"><UserSearch /> {label}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,380px)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Buscar por nombre o RNC…" />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</div>
            ) : error ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">{errorMessage(error)}</p>
            ) : (
              <>
                <CommandEmpty>Sin coincidencias. Puedes ingresar los datos manualmente.</CommandEmpty>
                <CommandGroup>
                  {data?.content.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onSelect(p);
                        setOpen(false);
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.legalName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.rnc}</p>
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
