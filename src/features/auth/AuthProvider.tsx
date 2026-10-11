import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ENV } from '@/constants/env';
import { STORAGE_KEYS } from '@/constants/storage';
import { authService } from '@/services/api/auth';
import { queryKeys } from '@/services/api/query-keys';
import { tokenStore } from '@/services/http/token-store';
import type { LoginInput, ModuleKey, Permission, SessionUser } from '@/types/account';
import { AuthContext, type AuthStatus } from './auth-context';

/**
 * En modo demostración se conserva solo el perfil (sin tokens) en sessionStorage
 * para no perder la navegación al recargar. En producción la sesión la restaura
 * el backend (cookie httpOnly + /auth/me).
 */
function readDemoSession(): SessionUser | null {
  if (!ENV.authUseMocks) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.demoSession);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(readDemoSession);
  const [status, setStatus] = useState<AuthStatus>(() => (ENV.authUseMocks ? (readDemoSession() ? 'authenticated' : 'anonymous') : 'loading'));
  const [sessionExpired, setSessionExpired] = useState(false);
  const rememberDemoSession = useRef(Boolean(readDemoSession()));

  useEffect(() => {
    if (ENV.authUseMocks) return;
    authService
      .refresh()
      .then((session) => {
        tokenStore.set(session.tokens);
        setUser(session.user);
        setStatus('authenticated');
      })
      .catch(() => setStatus('anonymous'));
  }, []);

  useEffect(
    () =>
      tokenStore.onSessionExpired(() => {
        setUser(null);
        setStatus('anonymous');
        setSessionExpired(true);
        queryClient.clear();
      }),
    [queryClient],
  );

  useEffect(() => {
    if (ENV.authUseMocks || status !== 'authenticated') return;
    let active = true;
    const refreshProfile = () => {
      if (document.visibilityState !== 'visible') return;
      void authService.me().then((latest) => {
        if (active && tokenStore.isAuthenticated()) {
          setUser(latest);
          if (latest.portal === 'tenant') {
            void queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
            void queryClient.invalidateQueries({ queryKey: queryKeys.modules });
            void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPayments });
          }
        }
      }).catch(() => { /* un fallo temporal no cierra la sesión */ });
    };
    window.addEventListener('focus', refreshProfile);
    document.addEventListener('visibilitychange', refreshProfile);
    const interval = window.setInterval(refreshProfile, 60_000);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshProfile);
      document.removeEventListener('visibilitychange', refreshProfile);
      window.clearInterval(interval);
    };
  }, [status, queryClient]);

  const persist = (u: SessionUser | null) => {
    if (!ENV.authUseMocks) return;
    if (u && rememberDemoSession.current) sessionStorage.setItem(STORAGE_KEYS.demoSession, JSON.stringify(u));
    else sessionStorage.removeItem(STORAGE_KEYS.demoSession);
  };

  const login = useCallback(async (input: LoginInput) => {
    const res = await authService.login(input);
    rememberDemoSession.current = input.remember;
    tokenStore.set(res.tokens);
    setUser(res.user);
    setStatus('authenticated');
    setSessionExpired(false);
    persist(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      tokenStore.set(null);
      persist(null);
      sessionStorage.removeItem(STORAGE_KEYS.onboardingDraft);
      sessionStorage.removeItem(STORAGE_KEYS.chatHistory);
      sessionStorage.removeItem(STORAGE_KEYS.chatGreeted);
      setUser(null);
      setStatus('anonymous');
      setSessionExpired(false);
      queryClient.clear();
    }
  }, [queryClient]);

  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      sessionExpired,
      login,
      logout,
      updateUser,
      hasPermission: (p: Permission) => !!user?.permissions.includes(p),
      hasModule: (m: ModuleKey) => !!user?.modules.includes(m),
    }),
    [user, status, sessionExpired, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
