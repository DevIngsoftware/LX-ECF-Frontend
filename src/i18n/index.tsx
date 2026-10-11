import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants/storage';
import { es, type Messages } from './locales/es';
import { en } from './locales/en';

export type Locale = 'es' | 'en';

const dictionaries: Record<Locale, Messages> = { es, en };

type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Path<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Path<Messages>;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function lookup(dict: Messages, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    localStorage.getItem(STORAGE_KEYS.locale) === 'en' ? 'en' : 'es',
  );

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEYS.locale, l);
    document.documentElement.lang = l;
    setLocaleState(l);
  }, []);

  const t = useCallback<I18nValue['t']>(
    (key, vars) => {
      let text = lookup(dictionaries[locale], key);
      if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
      return text;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return ctx;
}
