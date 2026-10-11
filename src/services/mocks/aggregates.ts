import type { DateRange } from '@/types/common';
import type { DashboardSummary } from '@/types/business';
import type { DgiiOverview, EcfTypeCode } from '@/types/ecf';
import { invoices, receivables } from './data';
import { daysAgo, daysAhead } from './utils';

export function buildDashboard(range: DateRange): DashboardSummary {
  const inRange = invoices.filter((i) => i.issueDate >= range.from && i.issueDate <= range.to);
  const sum = (arr: { total: number }[]) => arr.reduce((s, i) => s + i.total, 0);
  const byTypeMap = new Map<EcfTypeCode, { count: number; amount: number }>();
  inRange.forEach((i) => {
    const prev = byTypeMap.get(i.type) ?? { count: 0, amount: 0 };
    byTypeMap.set(i.type, { count: prev.count + 1, amount: prev.amount + i.total });
  });

  const from = new Date(range.from);
  const to = new Date(range.to);
  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const buckets = Math.min(12, Math.max(spanDays, 1));
  const step = spanDays / buckets;
  const trend = Array.from({ length: buckets }, (_, b) => {
    const start = new Date(from.getTime() + b * step * 86400000);
    const end = new Date(from.getTime() + (b + 1) * step * 86400000);
    const slice = inRange.filter((i) => i.issueDate >= start.toISOString() && i.issueDate < end.toISOString());
    const invoiced = sum(slice);
    return {
      date: start.toISOString(),
      invoiced,
      collected: sum(slice.filter((i) => i.paymentStatus === 'PAGADA')),
    };
  });

  return {
    totalInvoiced: sum(inRange),
    invoicesIssued: inRange.length,
    accepted: inRange.filter((i) => i.dgiiStatus === 'ACEPTADO' || i.dgiiStatus === 'ACEPTADO_CONDICIONAL').length,
    rejected: inRange.filter((i) => i.internalStatus === 'RECHAZADO').length,
    pending: inRange.filter((i) => !i.dgiiStatus || i.dgiiStatus === 'EN_PROCESO' || i.dgiiStatus === 'NO_ENVIADO').length,
    itbis: inRange.reduce((s, i) => s + i.itbis, 0),
    receivables: receivables.reduce((s, r) => s + r.balance, 0),
    collected: sum(inRange.filter((i) => i.paymentStatus === 'PAGADA')),
    trend,
    byType: [...byTypeMap.entries()].map(([type, v]) => ({ type, ...v })),
    alerts: [
      { id: 'a1', severity: 'warning', title: 'Configuración DGII incompleta', description: 'Completa el asistente de configuración para habilitar la emisión real.', link: '/app/onboarding' },
      { id: 'a2', severity: 'error', title: 'Comprobantes rechazados', description: 'Revisa los mensajes de validación en el Centro DGII.', link: '/app/dgii' },
      { id: 'a3', severity: 'warning', title: 'Certificado próximo a vencer', description: 'El certificado de demostración vence en 38 días.', link: '/app/configuracion/certificado' },
    ],
  };
}

export function buildDgiiOverview(): DgiiOverview {
  const counts = new Map<string, number>();
  invoices.forEach((i) => {
    const s = i.dgiiStatus ?? 'NO_ENVIADO';
    counts.set(s, (counts.get(s) ?? 0) + 1);
  });
  return {
    configured: false,
    environment: 'TesteCF',
    certificate: { subject: 'CN=EMPRESA DEMOSTRACION SRL (demo)', issuer: 'Entidad certificadora (demo)', serial: 'DEMO-00A1B2', validFrom: daysAgo(327), validTo: daysAhead(38) },
    sequences: [
      { type: 'E31', rangeFrom: 'E310000000001', rangeTo: 'E310000005000', current: 'E310000001210', remaining: 3790, expiresAt: daysAhead(420) },
      { type: 'E32', rangeFrom: 'E320000000001', rangeTo: 'E320000002000', current: 'E320000001880', remaining: 120, expiresAt: daysAhead(420) },
      { type: 'E33', rangeFrom: 'E330000000001', rangeTo: 'E330000000500', current: 'E330000000012', remaining: 488, expiresAt: daysAhead(420) },
      { type: 'E34', rangeFrom: 'E340000000001', rangeTo: 'E340000000500', current: 'E340000000031', remaining: 469, expiresAt: daysAhead(420) },
    ],
    statusCounts: [...counts.entries()].map(([status, count]) => ({ status, count })),
    recentRejections: invoices.filter((i) => i.internalStatus === 'RECHAZADO').slice(0, 6),
    events: invoices.slice(0, 8).flatMap((i) => i.history.slice(-1).map((h) => ({ ...h, description: `${i.encf}: ${h.description}` }))),
  };
}
