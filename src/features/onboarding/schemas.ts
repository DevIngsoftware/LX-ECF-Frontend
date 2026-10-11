import { z } from 'zod';
import type { CompanySettings } from '@/types/account';

export const STEP_FORM_ID = 'onboarding-step-form';
const DRAFT_KEY = 'lx-onboarding-draft';

export const STEPS = [
  { key: 'company', title: 'Información de la empresa', short: 'Empresa' },
  { key: 'fiscal', title: 'Datos fiscales', short: 'Fiscal' },
  { key: 'dgii', title: 'Configuración DGII', short: 'DGII' },
  { key: 'certificate', title: 'Certificado digital', short: 'Certificado' },
  { key: 'sequences', title: 'Secuencias e-NCF', short: 'Secuencias' },
  { key: 'preferences', title: 'Preferencias de facturación', short: 'Preferencias' },
  { key: 'verification', title: 'Verificación', short: 'Verificación' },
] as const;

export const LAST_STEP = STEPS.length - 1;

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);

export const companySchema = z.object({
  legalName: z.string().trim().min(2, 'Ingresa la razón social.').max(150, 'Máximo 150 caracteres.'),
  tradeName: optionalText(150),
  email: z.string().trim().min(1, 'Ingresa un correo de contacto.').email('Ingresa un correo válido.'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[\d\s()+-]{7,20}$/.test(v), 'Ingresa un teléfono válido.'),
  address: z.string().trim().min(5, 'Ingresa la dirección de la empresa.').max(250, 'Máximo 250 caracteres.'),
});
export type CompanyStepValues = z.infer<typeof companySchema>;

export const fiscalSchema = z.object({
  rnc: z
    .string()
    .trim()
    .refine((v) => /^(\d{9}|\d{11})$/.test(v.replace(/-/g, '')), 'El RNC debe tener 9 dígitos (o 11 si es cédula).'),
  economicActivity: z.string().trim().min(3, 'Indica la actividad económica principal.').max(150, 'Máximo 150 caracteres.'),
  province: z.string().trim().min(2, 'Indica la provincia o municipio.').max(80, 'Máximo 80 caracteres.'),
});
export type FiscalStepValues = z.infer<typeof fiscalSchema>;

export const ENVIRONMENTS = ['PRUEBAS', 'CERTIFICACION', 'PRODUCCION'] as const;
export type DgiiEnvironment = (typeof ENVIRONMENTS)[number];

export const dgiiSchema = z.object({
  environment: z.enum(ENVIRONMENTS, { errorMap: () => ({ message: 'Selecciona un ambiente.' }) }),
});
export type DgiiStepValues = z.infer<typeof dgiiSchema>;

export type CertificateStepValues = {
  status: 'uploaded' | 'pending';
  fileName?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const sequenceSchema = z
  .object({
    type: z.string().min(1, 'Selecciona el tipo.'),
    from: z.string().trim().regex(/^\d{1,10}$/, 'Número de 1 a 10 dígitos.'),
    to: z.string().trim().regex(/^\d{1,10}$/, 'Número de 1 a 10 dígitos.'),
    expiresAt: z.string().min(1, 'Indica el vencimiento.'),
  })
  .refine((s) => Number(s.to) >= Number(s.from), { path: ['to'], message: 'Debe ser mayor o igual que "desde".' })
  .refine((s) => !s.expiresAt || s.expiresAt > todayIso(), { path: ['expiresAt'], message: 'Debe ser una fecha futura.' });

export const sequencesSchema = z
  .object({ items: z.array(sequenceSchema) })
  .refine((v) => new Set(v.items.map((i) => i.type)).size === v.items.length, { path: ['items'], message: 'Registra una sola secuencia por tipo de e-CF.' });
export type SequencesStepValues = z.infer<typeof sequencesSchema>;

export const preferencesSchema = z.object({
  currency: z.enum(['DOP', 'USD'], { errorMap: () => ({ message: 'Selecciona la moneda.' }) }),
  itbisRate: z.enum(['18', '16', '0'], { errorMap: () => ({ message: 'Selecciona la tasa de ITBIS.' }) }),
  paymentTermDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, 'Indica los días (0 a 365).')
    .refine((v) => Number(v) <= 365, 'Máximo 365 días.'),
  paymentConditions: optionalText(300),
  notes: optionalText(500),
  sendEmailToBuyer: z.boolean(),
});
export type PreferencesStepValues = z.infer<typeof preferencesSchema>;

export interface OnboardingData {
  company: CompanyStepValues;
  fiscal: FiscalStepValues;
  dgii: DgiiStepValues;
  certificate: CertificateStepValues;
  sequences: SequencesStepValues;
  preferences: PreferencesStepValues;
}

export function defaultsFromCompany(c: CompanySettings | undefined): OnboardingData {
  const rate = String(c?.defaultItbisRate ?? 18);
  return {
    company: { legalName: c?.legalName ?? '', tradeName: c?.tradeName ?? '', email: c?.email ?? '', phone: c?.phone ?? '', address: c?.address ?? '' },
    fiscal: { rnc: c?.rnc ?? '', economicActivity: c?.economicActivity ?? '', province: '' },
    dgii: { environment: 'PRUEBAS' },
    certificate: { status: 'pending' },
    sequences: { items: [] },
    preferences: {
      currency: 'DOP',
      itbisRate: rate === '16' || rate === '0' ? rate : '18',
      paymentTermDays: String(c?.defaultPaymentTermDays ?? 30),
      paymentConditions: '',
      notes: c?.invoiceFooter ?? '',
      sendEmailToBuyer: c?.sendEmailToBuyer ?? true,
    },
  };
}

/** Borrador local sin datos sensibles (la contraseña del certificado nunca se guarda). */
export function loadDraft(): Partial<OnboardingData> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<OnboardingData>) : {};
  } catch {
    return {};
  }
}

export function saveDraft(data: OnboardingData) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}
