import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAuth } from '@/features/auth/auth-context';
import type { NavGroup } from '../navigation';

export function CommandSearch({ groups }: { groups: NavGroup[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg border bg-background text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground sm:w-64 sm:justify-start sm:px-3"
        aria-label="Buscar en la plataforma"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Buscar…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Ir a una sección…" />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          {groups.map((g, gi) => (
            <CommandGroup key={gi} heading={g.label ?? 'Principal'}>
              {g.items
                .filter((i) => !i.permission || !user || hasPermission(i.permission))
                .map((item) => (
                  <CommandItem
                    key={item.to}
                    value={item.label}
                    onSelect={() => {
                      setOpen(false);
                      navigate(item.to);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
