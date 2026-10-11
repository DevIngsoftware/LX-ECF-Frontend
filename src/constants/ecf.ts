import type { EcfTypeCode } from '@/types/ecf';

export type BuyerMode = 'required_rnc' | 'optional_rnc' | 'foreign' | 'none' | 'supplier';

/**
 * Configuración de experiencia de usuario por tipo de e-CF.
 * No sustituye las reglas fiscales: la validación definitiva la realiza el backend.
 */
export interface EcfTypeConfig {
  code: EcfTypeCode;
  name: string;
  short: string;
  description: string;
  buyerMode: BuyerMode;
  buyerLabel: string;
  requiresReference: boolean;
  allowsRetentions: boolean;
  allowsCredit: boolean;
}

export const ECF_TYPES: EcfTypeConfig[] = [
  { code: 'E31', name: 'Crédito Fiscal Electrónico', short: 'Crédito fiscal', description: 'Ventas a empresas o contribuyentes que necesitan sustentar costos y gastos.', buyerMode: 'required_rnc', buyerLabel: 'Comprador', requiresReference: false, allowsRetentions: true, allowsCredit: true },
  { code: 'E32', name: 'Consumo Electrónico', short: 'Consumo', description: 'Ventas a consumidores finales.', buyerMode: 'optional_rnc', buyerLabel: 'Comprador', requiresReference: false, allowsRetentions: false, allowsCredit: true },
  { code: 'E33', name: 'Nota de Débito Electrónica', short: 'Nota de débito', description: 'Aumenta el valor de un comprobante emitido previamente.', buyerMode: 'required_rnc', buyerLabel: 'Comprador', requiresReference: true, allowsRetentions: true, allowsCredit: true },
  { code: 'E34', name: 'Nota de Crédito Electrónica', short: 'Nota de crédito', description: 'Anula o reduce el valor de un comprobante emitido previamente.', buyerMode: 'required_rnc', buyerLabel: 'Comprador', requiresReference: true, allowsRetentions: true, allowsCredit: false },
  { code: 'E41', name: 'Compras Electrónico', short: 'Compras', description: 'Registro de compras a personas no inscritas como contribuyentes.', buyerMode: 'supplier', buyerLabel: 'Proveedor', requiresReference: false, allowsRetentions: true, allowsCredit: true },
  { code: 'E43', name: 'Gastos Menores Electrónico', short: 'Gastos menores', description: 'Gastos menores incurridos por el personal de la empresa.', buyerMode: 'none', buyerLabel: 'Receptor', requiresReference: false, allowsRetentions: false, allowsCredit: false },
  { code: 'E44', name: 'Regímenes Especiales Electrónico', short: 'Regímenes especiales', description: 'Ventas a entidades acogidas a regímenes especiales de tributación.', buyerMode: 'required_rnc', buyerLabel: 'Comprador', requiresReference: false, allowsRetentions: true, allowsCredit: true },
  { code: 'E45', name: 'Gubernamental Electrónico', short: 'Gubernamental', description: 'Ventas a entidades del Estado.', buyerMode: 'required_rnc', buyerLabel: 'Entidad gubernamental', requiresReference: false, allowsRetentions: true, allowsCredit: true },
  { code: 'E46', name: 'Exportaciones Electrónico', short: 'Exportaciones', description: 'Ventas de bienes o servicios a clientes en el exterior.', buyerMode: 'foreign', buyerLabel: 'Comprador extranjero', requiresReference: false, allowsRetentions: false, allowsCredit: true },
  { code: 'E47', name: 'Pagos al Exterior Electrónico', short: 'Pagos al exterior', description: 'Pagos a beneficiarios no residentes por servicios u otros conceptos.', buyerMode: 'foreign', buyerLabel: 'Beneficiario en el exterior', requiresReference: false, allowsRetentions: true, allowsCredit: false },
];

export const ECF_TYPE_MAP = Object.fromEntries(ECF_TYPES.map((t) => [t.code, t])) as Record<EcfTypeCode, EcfTypeConfig>;

/** Catálogos de referencia. Sujetos a confirmación con el contrato del backend. */
export const INCOME_TYPES = [
  { value: '01', label: '01 — Ingresos por operaciones (no financieros)' },
  { value: '02', label: '02 — Ingresos financieros' },
  { value: '03', label: '03 — Ingresos extraordinarios' },
  { value: '04', label: '04 — Ingresos por arrendamientos' },
  { value: '05', label: '05 — Ingresos por venta de activo depreciable' },
  { value: '06', label: '06 — Otros ingresos' },
];

export const PAYMENT_TYPES = [
  { value: '1', label: 'Contado' },
  { value: '2', label: 'Crédito' },
  { value: '3', label: 'Gratuito' },
];

export const MODIFICATION_CODES = [
  { value: '1', label: '1 — Anula el comprobante modificado' },
  { value: '2', label: '2 — Corrige texto del comprobante' },
  { value: '3', label: '3 — Corrige montos del comprobante' },
  { value: '4', label: '4 — Reemplazo de comprobante emitido en contingencia' },
  { value: '5', label: '5 — Referencia a factura de consumo electrónica' },
];

export const ITBIS_RATES = [
  { value: 18, label: '18%' },
  { value: 16, label: '16%' },
  { value: 0, label: 'Exento (0%)' },
];

export const INTERNAL_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  CREADO: { label: 'Creado', tone: 'info' },
  ACEPTADO: { label: 'Aceptado', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

export const DGII_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  ACEPTADO: { label: 'Aceptado DGII', tone: 'success' },
  ACEPTADO_CONDICIONAL: { label: 'Aceptado condicional', tone: 'warning' },
  RECHAZADO: { label: 'Rechazado DGII', tone: 'danger' },
  EN_PROCESO: { label: 'En proceso', tone: 'info' },
  NO_ENVIADO: { label: 'No enviado', tone: 'neutral' },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  PENDIENTE: { label: 'Pendiente de pago', tone: 'warning' },
  PARCIAL: { label: 'Pago parcial', tone: 'info' },
  PAGADA: { label: 'Pagada', tone: 'success' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
};

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
