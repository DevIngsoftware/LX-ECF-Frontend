import type {
  CertificationProgress, CertificationSimulationResult, CertificationTrackResult, CommercialApprovalResult,
  CertificationRepresentation, CertificationReceptionStatus, CertificationServiceUrls,
} from '@/types/certification';
import { get, getBlob, post, put } from '@/services/http/client';

const upload = <T>(path: string, file: File): Promise<T> => {
  const form = new FormData();
  form.append('file', file);
  return post<T>(path, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10 * 60_000 });
};

export const certificationService = {
  progress: () => get<CertificationProgress>('/cert/progreso'),
  processEcfSheet: (file: File) => upload<CertificationTrackResult[]>('/cert/prueba-datos-ecf/xls', file),
  processApprovalSheet: (file: File) => upload<CommercialApprovalResult[]>('/cert/prueba-datos-aprobacion-comercial/xls', file),
  simulate: (input: { lote: string; rncComprador: string; razonSocialComprador: string; reiniciar: boolean }) =>
    post<CertificationSimulationResult>('/cert/simulacion/paso-4', input, { timeout: 10 * 60_000 }),
  signXml: (xml: string) => post<string>('/cert/firmar', xml, {
    headers: { 'Content-Type': 'application/xml', Accept: 'application/xml' }, timeout: 60_000,
  }),
  portalXml: (lot: string, order: number) => getBlob(`/cert/simulacion/${encodeURIComponent(lot)}/xml/${order}`),
  representations: (lot: string) => get<CertificationRepresentation[]>(`/cert/simulacion/${encodeURIComponent(lot)}/representaciones`),
  representationPdf: (lot: string, tipo: number) => getBlob(`/cert/simulacion/${encodeURIComponent(lot)}/representaciones/${tipo}/pdf`),
  receptions: () => get<CertificationReceptionStatus>('/cert/recepciones'),
  serviceUrls: () => get<CertificationServiceUrls[]>('/cert/urls'),
  saveServiceUrls: (environment: 'CerteCF' | 'eCF', baseUrl: string) =>
    put<CertificationServiceUrls>(`/cert/urls/${environment}`, { baseUrl }),
  submitEvidence: (step: number, summary: string) =>
    post<CertificationProgress>(`/cert/pasos/${step}/evidencia`, { summary }),
  adminProgress: (companyId: string) => get<CertificationProgress>(`/admin/empresas/${companyId}/certificacion`),
  adminReceptions: (companyId: string) =>
    get<CertificationReceptionStatus>(`/admin/empresas/${companyId}/certificacion/recepciones`),
  review: (companyId: string, step: number, status: 'CONFIRMADO' | 'OBSERVADO', summary: string) =>
    put<CertificationProgress>(`/admin/empresas/${companyId}/certificacion/pasos/${step}`, { status, summary }),
};
