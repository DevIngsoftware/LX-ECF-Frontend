import type { Receivable, ReceivablePayment } from '@/types/business';

export const PAYMENT_METHODS = ['Transferencia', 'Efectivo', 'Cheque', 'Tarjeta', 'Depósito bancario', 'Otro'] as const;

const DAY = 86400000;

/** Días de atraso respecto al vencimiento (negativo si aún no vence). */
export const daysOverdue = (dueDate: string, now = Date.now()) => Math.floor((now - new Date(dueDate).getTime()) / DAY);

export const isOverdue = (r: Receivable) => r.balance > 0 && (r.status === 'VENCIDA' || daysOverdue(r.dueDate) > 0);

export interface AgingBucket {
  key: string;
  label: string;
  amount: number;
  count: number;
}

export function computeAging(list: Receivable[]): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { key: 'current', label: 'Por vencer', amount: 0, count: 0 },
    { key: '1-30', label: '1–30 días', amount: 0, count: 0 },
    { key: '31-60', label: '31–60 días', amount: 0, count: 0 },
    { key: '61-90', label: '61–90 días', amount: 0, count: 0 },
    { key: '90+', label: 'Más de 90', amount: 0, count: 0 },
  ];
  const now = Date.now();
  list.forEach((r) => {
    if (r.balance <= 0) return;
    const d = daysOverdue(r.dueDate, now);
    const idx = d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4;
    buckets[idx].amount += r.balance;
    buckets[idx].count += 1;
  });
  return buckets;
}

export function summarize(list: Receivable[], payments: ReceivablePayment[]) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    outstanding: list.reduce((s, r) => s + Math.max(r.balance, 0), 0),
    overdue: list.filter(isOverdue).reduce((s, r) => s + r.balance, 0),
    overdueCount: list.filter(isOverdue).length,
    collectedMonth: payments.filter((p) => toLocalMonth(p.date) === monthKey).reduce((s, p) => s + p.amount, 0),
    openCount: list.filter((r) => r.balance > 0).length,
  };
}

function toLocalMonth(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
