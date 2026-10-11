import type { InvoiceDraft } from '@/types/ecf';

/**
 * Adaptador hacia FacturaRequestDTO / ItemDTO del backend Spring Boot.
 * Los nombres de campo son PROVISIONALES: ajustar cuando se confirme el contrato OpenAPI.
 */
export interface ItemDTO {
  codigo?: string;
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
