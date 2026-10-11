const raw = import.meta.env;

const apiBaseUrl = (raw.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

export const ENV = {
  apiBaseUrl,
  /** Sin URL de API configurada, la interfaz funciona con datos de demostración. */
  useMocks: raw.VITE_USE_MOCKS === 'true' || apiBaseUrl === '',
  requestTimeoutMs: Number(raw.VITE_API_TIMEOUT_MS ?? 30000),
  chatApiPath: (raw.VITE_CHAT_API_PATH as string | undefined) ?? '',
} as const;

/** Canales oficiales de LoadExpress. Se muestran solo si están configurados. */
export const COMPANY = {
  legalName: 'LoadExpress, S.R.L.',
  product: 'LX e-CF',
  country: 'República Dominicana',
  website: (raw.VITE_LOADEXPRESS_URL as string | undefined) ?? '',
  email: (raw.VITE_CONTACT_EMAIL as string | undefined) ?? '',
  phone: (raw.VITE_CONTACT_PHONE as string | undefined) ?? '',
  whatsapp: (raw.VITE_CONTACT_WHATSAPP as string | undefined) ?? '',
  logo: '/assets/images/LOGO_ELIAS_(1).png',
} as const;
