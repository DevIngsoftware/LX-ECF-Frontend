import type { ReportData, ReportKey } from '@/types/business';
import { ECF_TYPES } from '@/constants/ecf';
import { customers, expenses, invoices, receivables } from './data';

const inRange = (date: string, r: { from: string; to: string }) => date >= r.from && date <= r.to;

export function buildReport(key: ReportKey, range: { from: string; to: string }): ReportData {
  const inv = invoices.filter((i) => inRange(i.issueDate, range));
  switch (key) {
    case 'sales':
    case 'trends': {
      const byMonth = new Map<string, { total: number; count: number; itbis: number }>();
      inv.forEach((i) => {
        const m = i.issueDate.slice(0, 7);
        const p = byMonth.get(m) ?? { total: 0, count: 0, itbis: 0 };
        byMonth.set(m, { total: p.total + i.total, count: p.count + 1, itbis: p.itbis + i.itbis });
      });
      const rows = [...byMonth.entries()].sort().map(([period, v]) => ({ period, count: v.count, itbis: v.itbis, total: v.total }));
      return {
        key,
        columns: [{ key: 'period', label: 'Período' }, { key: 'count', label: 'Comprobantes', numeric: true }, { key: 'itbis', label: 'ITBIS', numeric: true }, { key: 'total', label: 'Total facturado', numeric: true }],
        rows,
        chart: rows.map((r) => ({ label: r.period, value: r.total })),
      };
    }
    case 'types': {
      const rows = ECF_TYPES.map((t) => {
        const list = inv.filter((i) => i.type === t.code);
        return { type: `${t.code} — ${t.name}`, count: list.length, total: list.reduce((s, i) => s + i.total, 0) };
      }).filter((r) => r.count > 0);
      return { key, columns: [{ key: 'type', label: 'Tipo' }, { key: 'count', label: 'Cantidad', numeric: true }, { key: 'total', label: 'Monto', numeric: true }], rows, chart: rows.map((r) => ({ label: r.type.slice(0, 3), value: r.count })) };
    }
    case 'taxes': {
      const itbis = inv.reduce((s, i) => s + i.itbis, 0);
      const exp = expenses.filter((e) => inRange(e.date, range)).reduce((s, e) => s + e.itbis, 0);
      const rows = [
        { concept: 'ITBIS facturado', amount: itbis },
        { concept: 'ITBIS en gastos registrados', amount: exp },
        { concept: 'ITBIS retenido por terceros', amount: inv.reduce((s, i) => s + i.itbisRetained, 0) },
      ];
      return { key, columns: [{ key: 'concept', label: 'Concepto' }, { key: 'amount', label: 'Monto', numeric: true }], rows, chart: rows.map((r) => ({ label: r.concept, value: r.amount })) };
    }
    case 'customers': {
      const rows = customers.map((c) => {
        const list = inv.filter((i) => i.buyerRnc === c.rnc);
        return { customer: c.legalName, rnc: c.rnc, count: list.length, total: list.reduce((s, i) => s + i.total, 0) };
      }).filter((r) => r.count).sort((a, b) => b.total - a.total);
      return { key, columns: [{ key: 'customer', label: 'Cliente' }, { key: 'rnc', label: 'RNC' }, { key: 'count', label: 'Comprobantes', numeric: true }, { key: 'total', label: 'Total', numeric: true }], rows, chart: rows.slice(0, 6).map((r) => ({ label: r.customer.split(',')[0], value: r.total })) };
    }
    case 'expenses': {
      const map = new Map<string, number>();
      expenses.filter((e) => inRange(e.date, range)).forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
      const rows = [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
      return { key, columns: [{ key: 'category', label: 'Categoría' }, { key: 'amount', label: 'Monto', numeric: true }], rows, chart: rows.map((r) => ({ label: r.category, value: r.amount })) };
    }
    case 'receivables': {
      const map = new Map<string, number>();
      receivables.forEach((r) => map.set(String(r.status), (map.get(String(r.status)) ?? 0) + r.balance));
      const rows = [...map.entries()].map(([status, balance]) => ({ status, balance }));
      return { key, columns: [{ key: 'status', label: 'Estado de pago' }, { key: 'balance', label: 'Saldo', numeric: true }], rows, chart: rows.map((r) => ({ label: r.status, value: r.balance })) };
    }
    case 'dgii': {
      const map = new Map<string, number>();
      inv.forEach((i) => map.set(i.dgiiStatus ?? 'NO_ENVIADO', (map.get(i.dgiiStatus ?? 'NO_ENVIADO') ?? 0) + 1));
      const rows = [...map.entries()].map(([status, count]) => ({ status, count }));
      return { key, columns: [{ key: 'status', label: 'Estado DGII' }, { key: 'count', label: 'Comprobantes', numeric: true }], rows, chart: rows.map((r) => ({ label: r.status, value: r.count })) };
    }
  }
}
