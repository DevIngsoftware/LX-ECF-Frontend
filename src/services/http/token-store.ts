import type { AuthTokens } from '@/types/account';

/**
 * Tokens en memoria. La persistencia segura (cookie httpOnly / refresh token)
 * debe resolverla el backend Spring Security; nunca se guardan en localStorage.
 */
let tokens: AuthTokens | null = null;
let authenticated = false;
const listeners = new Set<() => void>();

export const tokenStore = {
  get: () => tokens,
  isAuthenticated: () => authenticated,
  set(next: AuthTokens | null) {
    tokens = next;
    authenticated = next !== null;
  },
  restoreSession() {
    authenticated = true;
  },
  onSessionExpired(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emitSessionExpired() {
    tokens = null;
    authenticated = false;
    listeners.forEach((fn) => fn());
  },
};
