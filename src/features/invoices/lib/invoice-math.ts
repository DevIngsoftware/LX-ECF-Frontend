export interface LineInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  itbisRate: number;
}

export interface InvoiceTotals {
  gross: number;
  discount: number;
  taxable: number;
  exempt: number;
  itbis: number;
  itbisByRate: { rate: number; base: number; amount: number }[];
  retainedItbis: number;
  retainedIsr: number;
  total: number;
  payable: number;
}

const safe = (n: number) => (Number.isFinite(n) ? n : 0);
export const round2 = (n: number) => Math.round(safe(n) * 100) / 100;

export function lineNet(l: LineInput): number {
  return round2(safe(l.quantity) * safe(l.unitPrice) - safe(l.discount));
}

export function lineItbis(l: LineInput): number {
  return round2(lineNet(l) * (safe(l.itbisRate) / 100));
}

/**
 * Cálculo orientativo para la interfaz. Los montos fiscales definitivos los calcula el backend.
 */
export function computeTotals(lines: LineInput[], retentions: { itbis: number; isr: number } = { itbis: 0, isr: 0 }): InvoiceTotals {
  const byRate = new Map<number, { base: number; amount: number }>();
  let gross = 0;
  let discount = 0;
  let exempt = 0;
  for (const l of lines) {
    gross += safe(l.quantity) * safe(l.unitPrice);
    discount += safe(l.discount);
    const net = lineNet(l);
    const rate = safe(l.itbisRate);
    if (rate === 0) exempt += net;
    const prev = byRate.get(rate) ?? { base: 0, amount: 0 };
    byRate.set(rate, { base: prev.base + net, amount: prev.amount + lineItbis(l) });
  }
  const taxable = round2(gross - discount);
  const itbis = round2([...byRate.values()].reduce((s, r) => s + r.amount, 0));
  const total = round2(taxable + itbis);
  const retainedItbis = round2(safe(retentions.itbis));
  const retainedIsr = round2(safe(retentions.isr));
  return {
    gross: round2(gross),
    discount: round2(discount),
    taxable,
    exempt: round2(exempt),
    itbis,
    itbisByRate: [...byRate.entries()]
      .filter(([rate]) => rate > 0)
      .sort(([a], [b]) => b - a)
      .map(([rate, v]) => ({ rate, base: round2(v.base), amount: round2(v.amount) })),
    retainedItbis,
    retainedIsr,
    total,
    payable: round2(total - retainedItbis - retainedIsr),
  };
}

/** Totales de un comprobante devuelto por el backend (subtotal ya neto de descuentos). */
export function detailTotals(inv: { subtotal: number; discountTotal: number; itbis: number; itbisRetained: number; isrRetained: number }) {
  return {
    subtotal: inv.subtotal,
    discount: inv.discountTotal,
    itbis: inv.itbis,
    retainedItbis: inv.itbisRetained,
    retainedIsr: inv.isrRetained,
    total: round2(inv.subtotal + inv.itbis),
  };
}
