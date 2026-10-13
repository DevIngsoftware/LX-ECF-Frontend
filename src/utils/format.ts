const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 });
const compactMoney = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', notation: 'compact', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('es-DO');

/** Formato RD$ */
export const formatMoney = (value: number) => money.format(value).replace('DOP', 'RD$').replace(/\u00a0/g, ' ');
export const formatMoneyCompact = (value: number) => compactMoney.format(value).replace('DOP', 'RD$').replace(/\u00a0/g, ' ');
export const formatNumber = (value: number) => number.format(value);

/** El catálogo conserva texto libre, pero los importes numéricos se publican en pesos dominicanos. */
export const formatPlanPrice = (label: string | null | undefined) => {
  const value = label?.trim();
  if (!value) return 'Consultar';
  const amount = value.replace(/^(?:RD\$|\$)\s*/i, '');
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount)) return value;
  return formatMoney(Number(amount.replace(/,/g, '')));
};

export const formatDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso)) : '—';

export const formatDateTime = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '—';

export function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (Math.abs(diff) < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  return rtf.format(-Math.round(diff / 86400), 'day');
}

export const daysUntil = (iso: string) => {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => Number(todayParts.find((item) => item.type === type)?.value);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(part('year'), part('month') - 1, part('day'))) / 86400000);
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
