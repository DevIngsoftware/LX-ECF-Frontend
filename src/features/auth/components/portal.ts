import { ROUTES } from '@/constants/routes';
import type { SessionUser } from '@/types/account';

export function portalRoot(user: Pick<SessionUser, 'portal'> | null | undefined): string {
  if (!user) return ROUTES.home;
  return user.portal === 'admin' ? ROUTES.admin.root : ROUTES.app.root;
}

/** Solo admite rutas internas del portal correspondiente para evitar redirecciones abiertas. */
export function safeRedirect(from: unknown, user: Pick<SessionUser, 'portal'>): string {
  const root = portalRoot(user);
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return root;
  return from === root || from.startsWith(`${root}/`) ? from : root;
}
