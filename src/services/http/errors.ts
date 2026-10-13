import axios from 'axios';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'conflict'
  | 'module_not_contracted'
  | 'subscription_inactive'
  | 'server'
  | 'cancelled'
  | 'unknown';

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SpringErrorBody {
  message?: string;
  error?: string;
  code?: string;
  detail?: string;
  title?: string;
  errors?: { field?: string; defaultMessage?: string; message?: string }[];
}

const FALLBACK: Record<ApiErrorKind, string> = {
  network: 'No hay conexión con el servidor. Verifica tu conexión a internet.',
  timeout: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  unauthorized: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  forbidden: 'No tienes permisos para realizar esta acción.',
  not_found: 'El recurso solicitado no existe.',
  validation: 'Revisa los datos ingresados.',
  conflict: 'La operación entra en conflicto con el estado actual.',
  module_not_contracted: 'Esta funcionalidad no está incluida en tu plan.',
  subscription_inactive: 'Tu suscripción no está activa.',
  server: 'El servicio no está disponible en este momento.',
  cancelled: 'La solicitud fue cancelada.',
  unknown: 'Ocurrió un error inesperado.',
};

function kindFromStatus(status: number, code?: string): ApiErrorKind {
  if (code === 'MODULE_NOT_CONTRACTED') return 'module_not_contracted';
  if (code === 'SUBSCRIPTION_INACTIVE') return 'subscription_inactive';
  if (status === 401) return 'unauthorized';
  if (status === 402) return 'subscription_inactive';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError('cancelled', FALLBACK.cancelled);
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiError('timeout', FALLBACK.timeout);
    if (!error.response) return new ApiError('network', FALLBACK.network);
    const { status, data } = error.response;
    if (typeof data === 'string') return new ApiError(kindFromStatus(status), data, status);
    const body = (data ?? {}) as SpringErrorBody;
    const kind = kindFromStatus(status, body.code);
    const fieldErrors: FieldError[] = (body.errors ?? []).map((e) => ({
      field: e.field ?? '',
      message: e.defaultMessage ?? e.message ?? '',
    }));
    return new ApiError(kind, body.message ?? body.detail ?? body.error ?? FALLBACK[kind], status, body.code, fieldErrors);
  }
  if (error instanceof Error) return new ApiError('unknown', error.message);
  return new ApiError('unknown', FALLBACK.unknown);
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}
