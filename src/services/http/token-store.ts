import type { AuthTokens } from '@/types/account';

/**
 * Tokens en memoria. La persistencia segura (cookie httpOnly / refresh token)
 * debe resolverla el backend Spring Security; nunca se guardan en localStorage.
 */
let tokens: AuthTokens | null = null;
const listeners = new Set<() => void>();

export const tokenStore = {
  get: () => tokens,
  set(next: AuthTokens | null) {
    tokens = next;
  },
  onSessionExpired(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emitSessionExpired() {
    tokens = null;
    listeners.forEach((fn) => fn());
  },
};
