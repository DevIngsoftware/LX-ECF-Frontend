import { FlaskConical, Rocket, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { DgiiEnvironment, OnboardingData } from './schemas';

export const ENVIRONMENT_INFO: Record<DgiiEnvironment, { label: string; icon: LucideIcon; text: string }> = {
  PRUEBAS: {
    label: 'Pruebas',
    icon: FlaskConical,
    text: 'Ambiente para validar la configuración y la integración. Los comprobantes no tienen validez fiscal.',
  },
  CERTIFICACION: {
    label: 'Certificación',
    icon: ShieldCheck,
    text: 'Ambiente en el que tu empresa completa el proceso de certificación como emisor electrónico ante la DGII.',
  },
  PRODUCCION: {
    label: 'Producción',
    icon: Rocket,
    text: 'Emisión con validez fiscal. Disponible solo cuando tu empresa ha sido autorizada por la DGII como emisor electrónico.',
  },
};

export interface CheckItem {
  step: number;
  label: string;
  ok: boolean;
  detail: string;
}

export function buildChecklist(data: OnboardingData, completed: number[]): CheckItem[] {
  const seqTypes = data.sequences.items.map((s) => s.type).join(', ');
  return [
    { step: 0, label: 'Información de la empresa', ok: completed.includes(0), detail: data.company.legalName || 'Sin completar' },
    { step: 1, label: 'Datos fiscales', ok: completed.includes(1), detail: data.fiscal.rnc ? `RNC ${data.fiscal.rnc}` : 'Sin completar' },
    { step: 2, label: 'Ambiente DGII', ok: completed.includes(2), detail: ENVIRONMENT_INFO[data.dgii.environment]?.label ?? 'Sin seleccionar' },
    {
      step: 3,
      label: 'Certificado digital',
      ok: data.certificate.status === 'uploaded',
      detail: data.certificate.status === 'uploaded' ? `${data.certificate.fileName ?? 'Archivo'} enviado para validación` : 'Pendiente de carga',
    },
    { step: 4, label: 'Secuencias e-NCF', ok: data.sequences.items.length > 0, detail: data.sequences.items.length ? seqTypes : 'Sin secuencias registradas' },
    {
      step: 5,
      label: 'Preferencias de facturación',
      ok: completed.includes(5),
      detail: `${data.preferences.currency} · ITBIS ${data.preferences.itbisRate}% · ${data.preferences.paymentTermDays} días`,
    },
  ];
}
