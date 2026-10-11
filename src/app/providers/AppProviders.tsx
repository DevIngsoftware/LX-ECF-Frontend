import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { I18nProvider } from '@/i18n';
import { ApiError } from '@/services/http/errors';
import { ThemeProvider } from './ThemeProvider';

const NO_RETRY_KINDS = new Set(['unauthorized', 'forbidden', 'not_found', 'validation', 'conflict', 'module_not_contracted', 'subscription_inactive', 'cancelled']);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => !(error instanceof ApiError && NO_RETRY_KINDS.has(error.kind)) && count < 2,
      },
      mutations: { retry: 0 },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
