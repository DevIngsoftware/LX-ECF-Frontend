import type { StatusTone } from '@/constants/ecf';
import type { TenantRole } from '@/types/account';

export const ROLES: TenantRole[] = ['ADMIN', 'FACTURACION', 'CONTABILIDAD', 'CONSULTA'];

export const ROLE_META: Record<TenantRole, { label: string; description: string; tone: StatusTone }> = {
  ADMIN: { label: 'Administrador', description: 'Acceso total: usuarios, configuración, suscripción e integraciones.', tone: 'brand' },
  FACTURACION: { label: 'Facturación', description: 'Emite comprobantes y gestiona clientes, catálogo y cobros.', tone: 'info' },
  CONTABILIDAD: { label: 'Contabilidad', description: 'Consulta comprobantes, reportes fiscales, gastos y cuentas por cobrar.', tone: 'warning' },
  CONSULTA: { label: 'Consulta', description: 'Solo lectura de comprobantes y reportes.', tone: 'neutral' },
};

export const roleLabel = (r: string) => ROLE_META[r as TenantRole]?.label ?? r;

/** Matriz orientativa. La autorización definitiva la aplica el backend. */
export const CAPABILITIES: { group: string; items: { label: string; roles: TenantRole[] }[] }[] = [
  {
    group: 'Facturación',
    items: [
      { label: 'Ver comprobantes', roles: ['ADMIN', 'FACTURACION', 'CONTABILIDAD', 'CONSULTA'] },
      { label: 'Emitir comprobantes', roles: ['ADMIN', 'FACTURACION'] },
      { label: 'Gestionar clientes y proveedores', roles: ['ADMIN', 'FACTURACION'] },
      { label: 'Gestionar catálogo', roles: ['ADMIN', 'FACTURACION'] },
    ],
  },
  {
    group: 'Finanzas',
    items: [
      { label: 'Registrar cobros', roles: ['ADMIN', 'FACTURACION', 'CONTABILIDAD'] },
      { label: 'Registrar gastos', roles: ['ADMIN', 'CONTABILIDAD'] },
      { label: 'Ver reportes', roles: ['ADMIN', 'FACTURACION', 'CONTABILIDAD', 'CONSULTA'] },
    ],
  },
  {
    group: 'Administración',
    items: [
      { label: 'Centro DGII', roles: ['ADMIN'] },
      { label: 'Usuarios y roles', roles: ['ADMIN'] },
      { label: 'Configuración de empresa', roles: ['ADMIN'] },
      { label: 'Suscripción y módulos', roles: ['ADMIN'] },
      { label: 'Credenciales de API', roles: ['ADMIN'] },
    ],
  },
];
