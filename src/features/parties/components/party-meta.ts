import { ROUTES } from '@/constants/routes';
import type { PartyKind } from '@/types/business';

export interface PartyMeta {
  title: string;
  singular: string;
  singularCap: string;
  description: string;
  totalLabel: string;
  documentsLabel: string;
  listRoute: string;
  detailRoute: (id: string) => string;
}

export const PARTY_META: Record<PartyKind, PartyMeta> = {
  customers: {
    title: 'Clientes',
    singular: 'cliente',
    singularCap: 'Cliente',
    description: 'Administra los compradores a quienes emites comprobantes electrónicos.',
    totalLabel: 'Total facturado',
    documentsLabel: 'Comprobantes emitidos',
    listRoute: ROUTES.app.customers,
    detailRoute: ROUTES.app.customer,
  },
  suppliers: {
    title: 'Proveedores',
    singular: 'proveedor',
    singularCap: 'Proveedor',
    description: 'Administra los proveedores de bienes y servicios de tu empresa.',
    totalLabel: 'Total comprado',
    documentsLabel: 'Documentos recibidos',
    listRoute: ROUTES.app.suppliers,
    detailRoute: ROUTES.app.supplier,
  },
};

/** Normaliza un RNC o cédula eliminando guiones y espacios. */
export const cleanRnc = (value: string) => value.replace(/[\s-]/g, '');

/** Formato visual: RNC 9 dígitos (1-23-45678-9) o cédula 11 dígitos (001-1234567-8). */
export function formatRnc(value: string) {
  const v = cleanRnc(value);
  if (/^\d{9}$/.test(v)) return `${v.slice(0, 1)}-${v.slice(1, 3)}-${v.slice(3, 8)}-${v.slice(8)}`;
  if (/^\d{11}$/.test(v)) return `${v.slice(0, 3)}-${v.slice(3, 10)}-${v.slice(10)}`;
  return value;
}
