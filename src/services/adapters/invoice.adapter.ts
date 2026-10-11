import { ECF_TYPE_MAP } from '@/constants/ecf';
import type { EcfTypeCode, InvoiceDraft } from '@/types/ecf';

/**
 * Adaptador hacia FacturaRequestDTO / ItemDTO del backend Spring Boot.
 * Contrato del portal de facturación (PortalInvoiceRequest).
 */
export interface ItemDTO {
  codigo?: string | null;
  descripcion: string;
  indicadorBienServicio: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tasaItbis: number;
}

export interface FacturaRequestDTO {
  tipoEcf: string;
  rncComprador?: string;
  razonSocialComprador?: string;
  correoComprador?: string;
  identificadorExtranjero?: string;
  paisComprador?: string;
  tipoIngresos: string;
  tipoPago: string;
  plazoPagoDias?: number;
  items: ItemDTO[];
  itbisRetenido: number;
  isrRetenido: number;
  ncfModificado?: string;
  fechaNcfModificado?: string;
  codigoModificacion?: string;
  razonModificacion?: string;
  observaciones?: string;
}

export function toFacturaRequestDTO(draft: InvoiceDraft): FacturaRequestDTO {
  return {
    tipoEcf: draft.type,
    rncComprador: draft.buyer.rnc || undefined,
    razonSocialComprador: draft.buyer.name || undefined,
    correoComprador: draft.buyer.email || undefined,
    identificadorExtranjero: draft.buyer.foreignId || undefined,
    paisComprador: draft.buyer.country || undefined,
    tipoIngresos: draft.incomeType,
    tipoPago: draft.paymentType,
    plazoPagoDias: draft.paymentTermDays,
    items: draft.items.map((i) => ({
      codigo: i.code,
      descripcion: i.description,
      indicadorBienServicio: i.kind === 'BIEN' ? '1' : '2',
      cantidad: i.quantity,
      precioUnitario: i.unitPrice,
      descuento: i.discount,
      tasaItbis: i.itbisRate,
    })),
    itbisRetenido: draft.retentions.itbis,
    isrRetenido: draft.retentions.isr,
    ncfModificado: draft.reference?.modifiedNcf,
    fechaNcfModificado: draft.reference?.modifiedDate,
    codigoModificacion: draft.reference?.modificationCode,
    razonModificacion: draft.reference?.reason,
    observaciones: draft.notes,
  };
}

/** Restaura el formulario guardado por la API sin inventar datos fiscales ausentes. */
export function fromFacturaRequestDTO(saved: FacturaRequestDTO): InvoiceDraft {
  const type = saved.tipoEcf in ECF_TYPE_MAP ? saved.tipoEcf as EcfTypeCode : 'E31';
  const amount = (value: number | null | undefined) => Number.isFinite(value) ? value! : 0;
  return {
    type,
    buyer: {
      rnc: saved.rncComprador ?? '', name: saved.razonSocialComprador ?? '',
      email: saved.correoComprador ?? '', foreignId: saved.identificadorExtranjero ?? '',
      country: saved.paisComprador ?? '',
    },
    incomeType: saved.tipoIngresos ?? '01',
    paymentType: saved.tipoPago ?? '1',
    paymentTermDays: saved.plazoPagoDias ?? undefined,
    items: (saved.items ?? []).map((item) => ({
      code: item.codigo ?? undefined, description: item.descripcion ?? '',
      kind: item.indicadorBienServicio === '1' ? 'BIEN' : 'SERVICIO',
      quantity: item.cantidad == null ? 1 : amount(item.cantidad), unitPrice: amount(item.precioUnitario),
      discount: amount(item.descuento), itbisRate: amount(item.tasaItbis),
    })),
    retentions: { itbis: amount(saved.itbisRetenido), isr: amount(saved.isrRetenido) },
    reference: {
      modifiedNcf: saved.ncfModificado ?? '', modifiedDate: saved.fechaNcfModificado ?? '',
      modificationCode: saved.codigoModificacion ?? '', reason: saved.razonModificacion ?? '',
    },
    notes: saved.observaciones ?? '',
  };
}
