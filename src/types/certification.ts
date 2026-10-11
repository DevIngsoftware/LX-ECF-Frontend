export type CertificationStepStatus = 'PENDIENTE' | 'EJECUTADO' | 'OBSERVADO' | 'CONFIRMADO';

export interface CertificationStepState {
  number: number;
  status: Exclude<CertificationStepStatus, 'PENDIENTE'>;
  summary: string | null;
  result: unknown;
  updatedAt: string;
}

export interface CertificationProgress {
  environment: 'TesteCF' | 'CerteCF' | 'eCF';
  steps: CertificationStepState[];
}

export interface CertificationTrackResult {
  trackId?: string;
  codigo?: number;
  estado?: string;
  rnc?: string;
  encf?: string;
  secuenciaUtilizada?: boolean;
  fechaRecepcion?: string;
  mensajes?: { codigo?: number; mensaje?: string }[];
}

export interface CommercialApprovalResult {
  encf: string;
  estado: string;
  codigo: string;
  mensaje: string[];
}

export interface CertificationSimulationResult {
  lote: string;
  completado: boolean;
  error: string | null;
  envios: { orden: number; documento: string; encf: string; estado: string; trackId: string | null }[];
  xmlFacturasConsumoParaPortal: string[];
}

export interface CertificationRepresentation { tipo: number; encf: string }
export interface CertificationReception { encf: string; receivedAt: string }
export interface CertificationReceptionStatus {
  ecf: CertificationReception[];
  approvals: CertificationReception[];
}
export interface CertificationServiceUrls {
  environment: 'CerteCF' | 'eCF';
  baseUrl: string;
  authentication: string;
  reception: string;
  approval: string;
}
