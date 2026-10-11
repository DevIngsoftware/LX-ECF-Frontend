import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme, type ThemePreference } from '@/app/providers/theme-context';
import { useI18n } from '@/i18n';

const OPTIONS: { value: ThemePreference; icon: typeof Sun; key: 'theme.light' | 'theme.dark' | 'theme.system' }[] = [
  { value: 'light', icon: Sun, key: 'theme.light' },
  { value: 'dark', icon: Moon, key: 'theme.dark' },
  { value: 'system', icon: Monitor, key: 'theme.system' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const Icon = resolvedTheme === 'dark' ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label={`${t('theme.label')}: ${t(`theme.${theme}`)}`}>
          <Icon className="transition-transform duration-300 hover:rotate-12" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t('theme.label')}</DropdownMenuLabel>
        {OPTIONS.map(({ value, icon: OptIcon, key }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="gap-2">
            <OptIcon className="h-4 w-4" />
            <span className="flex-1">{t(key)}</span>
            {theme === value && <Check className="h-4 w-4 text-brand" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
