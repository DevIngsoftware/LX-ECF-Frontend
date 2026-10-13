import { ROUTES } from '@/constants/routes';
import type { EcfTypeCode, InvoiceSummary } from '@/types/ecf';

export type NoteType = Extract<EcfTypeCode, 'E33' | 'E34'>;

export const noteRoute = (type: NoteType, refId: string) => `${ROUTES.app.newInvoice}?tipo=${type}&ref=${encodeURIComponent(refId)}`;

/**
 * Orientación de UX: solo se sugieren notas sobre comprobantes que no son notas
 * y que no fueron rechazados. La validación definitiva la realiza el backend.
 */
export function canCreateNoteFor(inv: Pick<InvoiceSummary, 'type' | 'internalStatus'>): boolean {
  return inv.type !== 'E33' && inv.type !== 'E34' && inv.internalStatus !== 'RECHAZADO';
}

export function canEditUnsentInvoice(inv: Pick<InvoiceSummary, 'internalStatus' | 'trackId' | 'dgiiStatus'>): boolean {
  return !inv.trackId
    && (!inv.dgiiStatus || inv.dgiiStatus === 'NO_ENVIADO')
    && (inv.internalStatus === 'CREADO' || inv.internalStatus === 'XML_GENERADO' || inv.internalStatus === 'FIRMADO');
}

export function isRfce(inv: Pick<InvoiceSummary, 'type' | 'total'>): boolean {
  return inv.type === 'E32' && inv.total < 250000;
}

export function canCheckDgiiStatus(inv: Pick<InvoiceSummary, 'type' | 'total' | 'trackId' | 'internalStatus'>): boolean {
  return !!inv.trackId || (isRfce(inv) && [
    'ENVIANDO', 'ENVIO_INCIERTO', 'ENVIADO', 'EN_PROCESO', 'ACEPTADO', 'ACEPTADO_CONDICIONAL', 'RECHAZADO',
  ].includes(inv.internalStatus));
}

export const DETAIL_TABS = ['resumen', 'documento', 'estado', 'historial'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];
export const isDetailTab = (v: string | null): v is DetailTab => !!v && (DETAIL_TABS as readonly string[]).includes(v);
