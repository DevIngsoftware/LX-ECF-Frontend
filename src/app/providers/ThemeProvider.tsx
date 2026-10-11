import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants/storage';
import { ThemeContext, type ResolvedTheme, type ThemePreference } from './theme-context';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return media().matches ? 'dark' : 'light';
  return pref;
}

function apply(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readPreference);
  const [resolvedTheme, setResolved] = useState<ResolvedTheme>(() => resolve(readPreference()));

  useEffect(() => {
    const next = resolve(theme);
    setResolved(next);
    apply(next);
    if (theme !== 'system') return;
    const mq = media();
    const onChange = () => {
      const r = mq.matches ? 'dark' : 'light';
      setResolved(r);
      apply(r);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEYS.theme, next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
