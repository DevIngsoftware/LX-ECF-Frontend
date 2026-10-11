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

export const DETAIL_TABS = ['resumen', 'documento', 'estado', 'historial'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];
export const isDetailTab = (v: string | null): v is DetailTab => !!v && (DETAIL_TABS as readonly string[]).includes(v);
