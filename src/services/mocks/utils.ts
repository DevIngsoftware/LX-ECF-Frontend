import type { Page, PageQuery } from '@/types/common';

export const delay = (ms = 450) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 250));

export const uid = () => Math.random().toString(36).slice(2, 10);

export const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, (n * 17) % 60, 0, 0);
  return d.toISOString();
};

export const daysAhead = (n: number) => daysAgo(-n);

/** Pseudoaleatorio determinista para que la demo sea estable entre recargas. */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function paginate<T>(items: T[], query: PageQuery = {}, searchFields: (keyof T)[] = []): Page<T> {
  const page = query.page ?? 0;
  const size = query.size ?? 10;
  let list = items;
  const q = query.search?.trim().toLowerCase();
  if (q && searchFields.length) {
    list = list.filter((item) => searchFields.some((f) => String(item[f] ?? '').toLowerCase().includes(q)));
  }
  if (query.sort) {
    const key = query.sort as keyof T;
    const dir = query.direction === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
  }
  return {
    content: list.slice(page * size, page * size + size),
    page,
    size,
    totalElements: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size)),
  };
}

export function demoBlob(title: string, body: string, type: string): Blob {
  return new Blob([`${title}\n\n${body}\n\n[DOCUMENTO DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL]`], { type });
}
