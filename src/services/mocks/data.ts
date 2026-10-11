import type { EcfTypeCode, InvoiceDetail, InvoiceSummary } from '@/types/ecf';
import type { Expense, Party, Product, ReceivedDocument, Receivable, ReceivablePayment } from '@/types/business';
import type { AppNotification, ModuleInfo, Plan, ServiceInvoice, TenantUser } from '@/types/account';
import type { AdminCompany, ApiCredential, AuditEvent, InternalUser, SupportTicket, AdminSubscription } from '@/types/platform';
import { daysAgo, daysAhead, seeded } from './utils';

/** TODOS los registros de este archivo son ficticios y solo existen para demostración. */
const rand = seeded(42);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

const companyNames = [
  'Comercial Demo Caribe', 'Distribuidora Ejemplo Norte', 'Servicios Muestra del Este', 'Ferretería Ficticia Central',
  'Tecnología Prueba Antillana', 'Agroindustrial Demo Cibao', 'Constructora Ejemplo Sur', 'Farmacia Muestra Popular',
  'Hotel Demo Bávaro', 'Importadora Ficticia Atlántica', 'Consultores Ejemplo Asociados', 'Panadería Demo Familiar',
];

const fakeRnc = (i: number) => `1${String(10000000 + i * 7919).slice(0, 8)}`;

export const customers: Party[] = companyNames.map((name, i) => ({
  id: `c${i + 1}`,
  rnc: fakeRnc(i),
  legalName: `${name}, S.R.L. (Demo)`,
  tradeName: name,
  email: `contacto${i + 1}@ejemplo.test`,
  phone: `809-555-${String(1000 + i * 37).slice(0, 4)}`,
  address: 'Dirección de demostración',
  active: i !== 7,
  createdAt: daysAgo(200 - i * 9),
  totalAmount: Math.round(80000 + rand() * 900000),
  documentsCount: Math.round(4 + rand() * 40),
}));

export const suppliers: Party[] = ['Papelería Demo', 'Telecom Ejemplo', 'Energía Muestra', 'Transporte Ficticio', 'Mantenimiento Demo', 'Software Ejemplo'].map(
  (name, i) => ({
    id: `s${i + 1}`,
    rnc: fakeRnc(i + 40),
    legalName: `${name}, S.A. (Demo)`,
    tradeName: name,
    email: `ventas${i + 1}@ejemplo.test`,
    phone: `829-555-${String(2000 + i * 53).slice(0, 4)}`,
    active: true,
    createdAt: daysAgo(300 - i * 20),
    totalAmount: Math.round(20000 + rand() * 300000),
    documentsCount: Math.round(2 + rand() * 20),
  }),
);

export const products: Product[] = [
  ['SRV-001', 'Consultoría por hora', 'SERVICIO', 3500, 18, 'Servicios profesionales'],
  ['SRV-002', 'Soporte técnico mensual', 'SERVICIO', 12500, 18, 'Servicios profesionales'],
  ['SRV-003', 'Instalación y configuración', 'SERVICIO', 8000, 18, 'Servicios técnicos'],
  ['BIE-001', 'Equipo de red (demo)', 'BIEN', 6450, 18, 'Equipos'],
  ['BIE-002', 'Licencia anual (demo)', 'BIEN', 24000, 18, 'Software'],
  ['BIE-003', 'Material de oficina', 'BIEN', 950, 18, 'Suministros'],
  ['BIE-004', 'Producto exento (demo)', 'BIEN', 1200, 0, 'Otros'],
  ['SRV-004', 'Capacitación grupal', 'SERVICIO', 18000, 18, 'Formación'],
].map(([code, name, kind, price, itbisRate, category], i) => ({
  id: `p${i + 1}`,
  code: code as string,
  name: name as string,
  kind: kind as Product['kind'],
  price: price as number,
  itbisRate: itbisRate as number,
  category: category as string,
  description: 'Artículo de demostración',
  active: i !== 6,
}));

const types: EcfTypeCode[] = ['E31', 'E31', 'E31', 'E32', 'E32', 'E34', 'E33', 'E44', 'E45', 'E46'];
const statusPairs: [string, string | undefined][] = [
  ['ACEPTADO', 'ACEPTADO'], ['ACEPTADO', 'ACEPTADO'], ['ACEPTADO', 'ACEPTADO'], ['ACEPTADO', 'ACEPTADO_CONDICIONAL'],
  ['CREADO', 'EN_PROCESO'], ['RECHAZADO', 'RECHAZADO'], ['CREADO', undefined],
];

export const invoices: InvoiceDetail[] = Array.from({ length: 64 }, (_, i) => {
  const type = pick(types);
  const buyer = pick(customers);
  const [internalStatus, dgiiStatus] = pick(statusPairs);
  const qty = 1 + Math.floor(rand() * 5);
  const product = pick(products);
  const subtotal = qty * product.price;
  const itbis = Math.round(subtotal * (product.itbisRate / 100) * 100) / 100;
  const issued = daysAgo(Math.floor(i * 5.5), 9 + (i % 8));
  const encf = `${type}${String(1 + i * 3).padStart(10, '0')}`;
  const rejected = internalStatus === 'RECHAZADO';
  const summary: InvoiceSummary = {
    id: `inv-${i + 1}`,
    encf,
    type,
    buyerName: type === 'E32' && i % 2 ? 'Consumidor final' : buyer.legalName,
    buyerRnc: type === 'E32' && i % 2 ? undefined : buyer.rnc,
    issueDate: issued,
    total: subtotal + itbis,
    itbis,
    internalStatus,
    dgiiStatus,
    trackId: dgiiStatus ? `demo-${(i * 104729).toString(16)}-track` : undefined,
    paymentStatus: internalStatus === 'ACEPTADO' ? pick(['PAGADA', 'PENDIENTE', 'PARCIAL', 'PAGADA'] as const) : undefined,
  };
  return {
    ...summary,
    buyer: { rnc: summary.buyerRnc, name: summary.buyerName, email: buyer.email },
    items: [{ id: `it-${i}`, code: product.code, description: product.name, kind: product.kind, quantity: qty, unitPrice: product.price, discount: 0, itbisRate: product.itbisRate }],
    subtotal,
    discountTotal: 0,
    itbisRetained: 0,
    isrRetained: 0,
    incomeType: '01',
    paymentType: summary.paymentStatus === 'PAGADA' ? '1' : '2',
    paymentTermDays: 30,
    reference: type === 'E33' || type === 'E34' ? { modifiedNcf: `E31${String(i).padStart(10, '0')}`, modifiedDate: daysAgo(i * 5 + 10), modificationCode: '3', reason: 'Corrección de montos (demo)' } : undefined,
    securityCode: dgiiStatus ? Math.random().toString(36).slice(2, 8).toUpperCase() : undefined,
    signedAt: dgiiStatus ? issued : undefined,
    verificationUrl: undefined,
    history: [
      { at: issued, type: 'CREADO', description: 'Comprobante creado en LX e-CF', actor: 'Usuario demo' },
      ...(dgiiStatus ? [{ at: issued, type: 'FIRMADO', description: 'Documento firmado por el backend (demo)' }, { at: issued, type: 'ENVIADO', description: 'Enviado al servicio de recepción (demo)' }] : []),
      ...(dgiiStatus && dgiiStatus !== 'EN_PROCESO' ? [{ at: issued, type: dgiiStatus, description: `Estado informado: ${dgiiStatus} (demo)` }] : []),
    ],
    dgiiMessages: rejected
      ? [{ code: 'DEMO-01', message: 'Mensaje técnico de rechazo de ejemplo.', explanation: 'Ejemplo de cómo se mostraría la explicación de un rechazo. No proviene de la DGII.' }]
      : [],
  };
});

export const receivables: Receivable[] = invoices
  .filter((inv) => inv.paymentStatus && inv.paymentStatus !== 'PAGADA')
  .map((inv, i) => {
    const paid = inv.paymentStatus === 'PARCIAL' ? Math.round(inv.total * 0.4) : 0;
    const due = new Date(inv.issueDate);
    due.setDate(due.getDate() + 30);
    const overdue = due.getTime() < Date.now();
    return {
      id: `r${i + 1}`,
      invoiceId: inv.id,
      encf: inv.encf,
      customerName: inv.buyerName,
      issueDate: inv.issueDate,
      dueDate: due.toISOString(),
      total: inv.total,
      paid,
      balance: inv.total - paid,
      status: overdue ? 'VENCIDA' : inv.paymentStatus ?? 'PENDIENTE',
    };
  });

export const payments: ReceivablePayment[] = receivables
  .filter((r) => r.paid > 0)
  .map((r, i) => ({ id: `pay${i}`, receivableId: r.id, encf: r.encf, date: daysAgo(3 + i), amount: r.paid, method: 'Transferencia', reference: `REF-DEMO-${i + 100}` }));

export const receivedDocuments: ReceivedDocument[] = Array.from({ length: 22 }, (_, i) => {
  const s = pick(suppliers);
  const total = Math.round(3000 + rand() * 90000);
  return {
    id: `rd${i + 1}`,
    encf: `E31${String(5000 + i * 11).padStart(10, '0')}`,
    type: 'E31',
    supplierName: s.legalName,
    supplierRnc: s.rnc,
    issueDate: daysAgo(i * 4 + 1),
    receivedAt: daysAgo(i * 4),
    total,
    itbis: Math.round((total / 1.18) * 0.18),
    status: pick(['RECIBIDO', 'ACEPTADO', 'ACEPTADO', 'EN_REVISION', 'RECHAZADO'] as const),
    hasPdf: i % 3 !== 0,
  };
});

export const expenseCategories = ['Servicios básicos', 'Alquiler', 'Combustible', 'Suministros de oficina', 'Telecomunicaciones', 'Mantenimiento', 'Honorarios profesionales', 'Otros'];

export const expenses: Expense[] = Array.from({ length: 30 }, (_, i) => {
  const s = pick(suppliers);
  const amount = Math.round(1500 + rand() * 45000);
  return {
    id: `e${i + 1}`,
    date: daysAgo(i * 3 + 1),
    supplierName: s.legalName,
    supplierRnc: s.rnc,
    category: pick(expenseCategories),
    description: 'Gasto de demostración',
    amount,
    itbis: Math.round(amount * 0.18),
    ncf: i % 4 ? `E31${String(9000 + i).padStart(10, '0')}` : undefined,
  };
});

export const modules: ModuleInfo[] = [
  { key: 'reception', name: 'Recepción de e-CF', description: 'Recibe y gestiona comprobantes electrónicos emitidos por tus proveedores.', benefits: ['Bandeja centralizada de documentos recibidos', 'Consulta de XML y PDF', 'Historial por proveedor'], requirements: ['Empresa habilitada como receptor electrónico'], status: 'DISPONIBLE', availability: 'Todos los planes' },
  { key: 'receivables', name: 'Cuentas por cobrar', description: 'Controla saldos, vencimientos y pagos de tus facturas emitidas.', benefits: ['Registro de pagos parciales', 'Alertas de vencimiento', 'Reportes de antigüedad'], requirements: [], status: 'ACTIVO', availability: 'Planes empresariales' },
  { key: 'catalog', name: 'Catálogo de productos y servicios', description: 'Agiliza la emisión con artículos, precios e impuestos predefinidos.', benefits: ['Autocompletado en facturas', 'Categorías y códigos', 'Sin control de inventario obligatorio'], requirements: [], status: 'ACTIVO', availability: 'Todos los planes' },
  { key: 'advanced_reports', name: 'Reportes avanzados', description: 'Análisis de ventas, impuestos y tendencias con exportación.', benefits: ['Preparación de 606 y 607', 'Exportación CSV, Excel y PDF', 'Tendencias comparativas'], requirements: [], status: 'DISPONIBLE', availability: 'Planes empresariales' },
  { key: 'api', name: 'API comercial', description: 'Integra la emisión de e-CF con tu ERP, POS o tienda en línea.', benefits: ['Credenciales sandbox y producción', 'Historial de solicitudes', 'Documentación para desarrolladores'], requirements: ['Configuración DGII completa'], status: 'ACTIVO', availability: 'Bajo solicitud' },
  { key: 'expenses', name: 'Gestión de gastos', description: 'Registra y clasifica los gastos de tu empresa por período.', benefits: ['Categorías personalizables', 'Asociación con proveedores', 'Resúmenes por período'], requirements: [], status: 'SOLICITADO', availability: 'Todos los planes' },
];

export const plans: Plan[] = [
  { id: 'plan-inicial', name: 'Inicial', description: 'Para pequeñas empresas que comienzan con la facturación electrónica.', priceLabel: null, invoiceLimit: null, userLimit: 2, modules: ['catalog'], active: true },
  { id: 'plan-empresarial', name: 'Empresarial', description: 'Para empresas en crecimiento con varios usuarios y módulos.', priceLabel: null, invoiceLimit: null, userLimit: 10, modules: ['catalog', 'receivables', 'api'], active: true, highlighted: true },
  { id: 'plan-corporativo', name: 'Corporativo', description: 'Para operaciones de alto volumen e integraciones avanzadas.', priceLabel: null, invoiceLimit: null, userLimit: null, modules: ['catalog', 'receivables', 'api', 'reception', 'advanced_reports', 'expenses'], active: true },
];

export const serviceInvoices: ServiceInvoice[] = Array.from({ length: 6 }, (_, i) => ({
  id: `si${i}`,
  number: `LX-DEMO-${String(2026 - Math.floor(i / 12))}-${String(12 - i).padStart(4, '0')}`,
  date: daysAgo(i * 30 + 2),
  concept: 'Suscripción LX e-CF — Plan Empresarial (demo)',
  amount: 0,
  status: i === 0 ? 'PENDIENTE' : 'PAGADA',
}));

export const notifications: AppNotification[] = [
  { id: 'n1', category: 'DGII', severity: 'error', title: 'Comprobante rechazado', message: 'Un comprobante de demostración figura como rechazado. Revisa los mensajes de validación.', createdAt: daysAgo(0, 9), read: false, link: '/app/dgii' },
  { id: 'n2', category: 'CERTIFICADO', severity: 'warning', title: 'Certificado próximo a vencer', message: 'El certificado digital de demostración vence en 38 días.', createdAt: daysAgo(1), read: false, link: '/app/configuracion/certificado' },
  { id: 'n3', category: 'SECUENCIAS', severity: 'warning', title: 'Secuencia E32 por agotarse', message: 'Quedan pocos números disponibles en la secuencia de consumo (demo).', createdAt: daysAgo(2), read: false, link: '/app/dgii' },
  { id: 'n4', category: 'DGII', severity: 'info', title: 'Comprobantes pendientes', message: 'Hay comprobantes en proceso de validación (demo).', createdAt: daysAgo(3), read: true, link: '/app/comprobantes' },
  { id: 'n5', category: 'SUSCRIPCION', severity: 'info', title: 'Renovación de suscripción', message: 'Tu suscripción se renovará próximamente (demo).', createdAt: daysAgo(5), read: true, link: '/app/suscripcion' },
  { id: 'n6', category: 'SEGURIDAD', severity: 'success', title: 'Nuevo inicio de sesión', message: 'Se detectó un inicio de sesión desde un nuevo dispositivo (demo).', createdAt: daysAgo(6), read: true },
  { id: 'n7', category: 'ADMIN', severity: 'info', title: 'Aviso de mantenimiento', message: 'Mantenimiento programado de la plataforma (demo).', createdAt: daysAgo(9), read: true },
];

export const tenantUsers: TenantUser[] = [
  { id: 'u1', name: 'Usuario Demo', email: 'demo@ejemplo.test', role: 'ADMIN', active: true, lastLoginAt: daysAgo(0) },
  { id: 'u2', name: 'Ana Facturación (demo)', email: 'facturacion@ejemplo.test', role: 'FACTURACION', active: true, lastLoginAt: daysAgo(1) },
  { id: 'u3', name: 'Luis Contabilidad (demo)', email: 'contabilidad@ejemplo.test', role: 'CONTABILIDAD', active: true, lastLoginAt: daysAgo(4) },
  { id: 'u4', name: 'Carla Consulta (demo)', email: 'consulta@ejemplo.test', role: 'CONSULTA', active: false },
];

export const credentials: ApiCredential[] = [
  { id: 'k1', name: 'ERP interno', prefix: 'lx_test_9f2a', environment: 'sandbox', createdAt: daysAgo(40), lastUsedAt: daysAgo(0), status: 'ACTIVA' },
  { id: 'k2', name: 'Tienda en línea', prefix: 'lx_live_31bc', environment: 'production', createdAt: daysAgo(15), lastUsedAt: daysAgo(1), status: 'ACTIVA' },
  { id: 'k3', name: 'Prueba antigua', prefix: 'lx_test_77de', environment: 'sandbox', createdAt: daysAgo(120), status: 'REVOCADA' },
];

export const adminCompanies: AdminCompany[] = companyNames.map((name, i) => ({
  id: `co${i + 1}`,
  name: `${name} (Demo)`,
  rnc: fakeRnc(i + 100),
  status: pick(['ACTIVA', 'ACTIVA', 'ACTIVA', 'PRUEBA', 'ONBOARDING', 'SUSPENDIDA'] as const),
  plan: pick(plans).name,
  modules: pick(plans).modules,
  createdAt: daysAgo(400 - i * 30),
  documentsThisMonth: Math.round(rand() * 2400),
  users: 1 + Math.floor(rand() * 12),
}));

export const adminSubscriptions: AdminSubscription[] = adminCompanies.map((c, i) => ({
  id: `as${i}`,
  company: c.name,
  plan: c.plan,
  status: c.status === 'SUSPENDIDA' ? 'SUSPENDIDA' : c.status === 'PRUEBA' ? 'PRUEBA' : 'ACTIVA',
  renewalDate: daysAhead(5 + i * 6),
  lastPaymentAt: c.status === 'PRUEBA' ? undefined : daysAgo(25 - i),
  amount: 0,
}));

export const internalUsers: InternalUser[] = [
  { id: 'iu1', name: 'Administrador LX (demo)', email: 'admin@loadexpress.test', role: 'SUPERADMIN', active: true, lastLoginAt: daysAgo(0) },
  { id: 'iu2', name: 'Soporte LX (demo)', email: 'soporte@loadexpress.test', role: 'SOPORTE', active: true, lastLoginAt: daysAgo(1) },
  { id: 'iu3', name: 'Comercial LX (demo)', email: 'comercial@loadexpress.test', role: 'COMERCIAL', active: true, lastLoginAt: daysAgo(3) },
  { id: 'iu4', name: 'Finanzas LX (demo)', email: 'finanzas@loadexpress.test', role: 'FINANZAS', active: false },
];

export const tickets: SupportTicket[] = Array.from({ length: 14 }, (_, i) => ({
  id: `T-${1040 + i}`,
  subject: pick(['Error al cargar certificado', 'Consulta sobre secuencias', 'Rechazo de comprobante', 'Cambio de plan', 'Acceso de usuario', 'Integración API']),
  company: pick(adminCompanies).name,
  priority: pick(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const),
  status: pick(['ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO'] as const),
  createdAt: daysAgo(i * 2 + 1),
  updatedAt: daysAgo(i),
  assignee: i % 3 ? 'Soporte LX (demo)' : undefined,
}));

export const auditEvents: AuditEvent[] = Array.from({ length: 30 }, (_, i) => ({
  id: `a${i}`,
  at: daysAgo(Math.floor(i / 3), 8 + (i % 10)),
  actor: pick(internalUsers).email,
  action: pick(['Inicio de sesión', 'Cambio de plan', 'Suspensión de empresa', 'Edición de plan', 'Creación de usuario interno', 'Actualización de parámetros']),
  target: pick(adminCompanies).name,
  ip: `10.0.${i % 5}.${20 + i}`,
  category: pick(['ACCESO', 'CAMBIO', 'EVENTO'] as const),
}));
