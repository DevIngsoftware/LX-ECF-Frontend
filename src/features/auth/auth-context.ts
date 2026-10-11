import { createContext, useContext } from 'react';
import type { LoginInput, ModuleKey, Permission, SessionUser } from '@/types/account';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  sessionExpired: boolean;
  login: (input: LoginInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  hasPermission: (p: Permission) => boolean;
  hasModule: (m: ModuleKey) => boolean;
  updateUser: (patch: Partial<SessionUser>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
