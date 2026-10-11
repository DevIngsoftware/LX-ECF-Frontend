import {
  Archive, Building2, CreditCard, FileKey2, Hash, Landmark, LayoutTemplate, Plug, Receipt, ShieldCheck, SlidersHorizontal, Users, type LucideIcon,
} from 'lucide-react';

export type SettingsSlug =
  | 'empresa' | 'fiscal' | 'dgii' | 'certificado' | 'secuencias' | 'facturacion' | 'plantillas' | 'usuarios' | 'seguridad' | 'suscripcion' | 'integraciones' | 'respaldo';

export interface SettingsSectionDef {
  slug: SettingsSlug;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Clave correspondiente en settingsService.status(). */
  statusKey?: string;
  group: 'Empresa' | 'Facturación electrónica' | 'Cuenta';
}

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  { slug: 'empresa', label: 'Datos de empresa', description: 'Nombre, contacto y dirección.', icon: Building2, statusKey: 'company', group: 'Empresa' },
  { slug: 'fiscal', label: 'Información fiscal', description: 'RNC y actividad económica.', icon: Landmark, statusKey: 'fiscal', group: 'Empresa' },
  { slug: 'dgii', label: 'Ambiente DGII', description: 'Ambiente de pruebas, certificación o producción.', icon: SlidersHorizontal, group: 'Facturación electrónica' },
  { slug: 'certificado', label: 'Certificado digital', description: 'Firma de comprobantes (.p12 / .pfx).', icon: FileKey2, statusKey: 'certificate', group: 'Facturación electrónica' },
  { slug: 'secuencias', label: 'Secuencias', description: 'Rangos autorizados de e-NCF.', icon: Hash, statusKey: 'sequences', group: 'Facturación electrónica' },
  { slug: 'facturacion', label: 'Preferencias de facturación', description: 'Condiciones e impuestos por defecto.', icon: Receipt, statusKey: 'preferences', group: 'Facturación electrónica' },
  { slug: 'plantillas', label: 'Plantillas', description: 'Representación impresa de comprobantes.', icon: LayoutTemplate, statusKey: 'templates', group: 'Facturación electrónica' },
  { slug: 'usuarios', label: 'Usuarios', description: 'Equipo, roles y permisos.', icon: Users, group: 'Cuenta' },
  { slug: 'seguridad', label: 'Seguridad', description: 'Contraseña, sesiones y verificación.', icon: ShieldCheck, group: 'Cuenta' },
  { slug: 'suscripcion', label: 'Suscripción', description: 'Plan, consumo y facturas.', icon: CreditCard, group: 'Cuenta' },
  { slug: 'integraciones', label: 'Integraciones', description: 'Credenciales de API.', icon: Plug, group: 'Cuenta' },
  { slug: 'respaldo', label: 'Copia de seguridad', description: 'Exporta los datos y archivos de tu empresa.', icon: Archive, group: 'Cuenta' },
];

export const isSettingsSlug = (s: string | undefined): s is SettingsSlug => !!s && SETTINGS_SECTIONS.some((x) => x.slug === s);

export const sectionBySlug = (s: SettingsSlug) => SETTINGS_SECTIONS.find((x) => x.slug === s) as SettingsSectionDef;
