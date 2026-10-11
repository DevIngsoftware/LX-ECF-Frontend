import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Download, FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { certificationService } from '@/services/api/certification';
import { errorMessage } from '@/services/http/errors';
import type { CertificationProgress, CertificationSimulationResult, CertificationStepState,
  CertificationStepStatus, CertificationTrackResult, CommercialApprovalResult } from '@/types/certification';
import { saveBlob } from '@/utils/download';
import { formatDateTime } from '@/utils/format';
import { CERTIFICATION_STEPS } from '../certification-steps';
import { CertificationStepTools } from '../components/CertificationStepTools';

const statusMeta: Record<CertificationStepStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'neutral' },
  EJECUTADO: { label: 'Prueba ejecutada', tone: 'info' },
  OBSERVADO: { label: 'Con observaciones', tone: 'warning' },
  CONFIRMADO: { label: 'Confirmado', tone: 'success' },
};

function stepState(progress: CertificationProgress | undefined, number: number): CertificationStepState | undefined {
  return progress?.steps.find((item) => item.number === number);
}

function Results({ step, state, lot, onDownload, downloading }: {
  step: number;
  state?: CertificationStepState;
  lot?: string;
  onDownload(order: number): void;
  downloading: boolean;
}) {
  if (!state?.result) return null;
  if ((step === 2 || step === 3) && Array.isArray(state.result)) {
    const rows = state.result as (CertificationTrackResult | CommercialApprovalResult)[];
    return <div className="space-y-2">
      <h3 className="font-semibold">Últimos resultados ({rows.length})</h3>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">La API no devolvió filas.</p>}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {rows.map((row, index) => <div key={`${row.encf ?? index}-${index}`} className="rounded-lg border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.encf ?? `Fila ${index + 1}`}</strong><span>{row.estado ?? 'Sin estado'}</span></div>
          {'trackId' in row && row.trackId && <p className="mt-1 font-mono text-xs">Track ID: {row.trackId}</p>}
          {'mensajes' in row && Array.isArray(row.mensajes) && row.mensajes.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{row.mensajes.map((message) => message.mensaje).filter(Boolean).join(' · ')}</p>}
          {'mensaje' in row && Array.isArray(row.mensaje) && row.mensaje.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{row.mensaje.join(' · ')}</p>}
        </div>)}
      </div>
    </div>;
  }
  if (step === 4 && typeof state.result === 'object' && state.result !== null) {
    const result = state.result as CertificationSimulationResult;
    return <div className="space-y-3">
      <h3 className="font-semibold">Último lote: {result.lote}</h3>
      <p className="text-sm text-muted-foreground">{result.envios?.length ?? 0} envíos registrados. {result.completado ? 'La simulación terminó; la validación del proceso sigue pendiente.' : result.error ?? 'La simulación no terminó.'}</p>
      {!!result.envios?.length && <div className="max-h-80 overflow-y-auto rounded-lg border"><ul className="divide-y">{result.envios.map((item) => <li key={item.orden} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"><span>{item.documento} · {item.encf}</span><span>{item.estado}</span></li>)}</ul></div>}
      {result.completado && (result.xmlFacturasConsumoParaPortal?.length ?? 0) > 0 && <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <p>XML íntegros de los E32 pequeños para cargar en el portal de certificación:</p>
        <div className="flex flex-wrap gap-2">{[22, 23, 24, 25].map((order) => <Button key={order} variant="outline" size="sm" disabled={downloading || !lot} onClick={() => onDownload(order)}><Download /> XML {order}</Button>)}</div>
      </div>}
    </div>;
  }
  return null;
}

export function CertificationPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [lot, setLot] = useState('paso4');
  const [buyerRnc, setBuyerRnc] = useState('101010101');
  const [buyerName, setBuyerName] = useState('Comprador de simulación');
  const [xml, setXml] = useState('');
  const progress = useQuery({ queryKey: ['certification', 'progress'], queryFn: certificationService.progress });
  const state = stepState(progress.data, selected);
  const simulationLot = (stepState(progress.data, 4)?.result as CertificationSimulationResult | undefined)?.lote;
  const enabled = progress.data?.environment === 'CerteCF';

  const execute = useMutation({
    mutationFn: async () => {
      if (selected === 2) return certificationService.processEcfSheet(file!);
      if (selected === 3) return certificationService.processApprovalSheet(file!);
      return certificationService.simulate({ lote: lot.trim(), rncComprador: buyerRnc.trim(), razonSocialComprador: buyerName.trim(), reiniciar: false });
    },
    onSuccess: () => {
      setConfirm(false);
      toast.success('Prueba procesada por la API', { description: 'Revisa el resultado. La confirmación de la etapa se registra por separado.' });
      void qc.invalidateQueries({ queryKey: ['certification', 'progress'] });
    },
    onError: (error) => {
      setConfirm(false);
      toast.error(errorMessage(error));
      void qc.invalidateQueries({ queryKey: ['certification', 'progress'] });
    },
  });
  const sign = useMutation({
    mutationFn: () => certificationService.signXml(xml),
    onSuccess: (signed) => { saveBlob(new Blob([signed], { type: 'application/xml' }), 'ecf-firmado.xml'); toast.success('XML firmado y descargado'); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const download = useMutation({
    mutationFn: (order: number) => certificationService.portalXml((state?.result as CertificationSimulationResult).lote, order),
    onSuccess: (blob, order) => saveBlob(blob, `certificacion-${(state?.result as CertificationSimulationResult).lote}-${order}.xml`),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const canRun = enabled && !execute.isPending && (selected === 4
    ? /^[a-zA-Z0-9_-]{1,40}$/.test(lot) && /^(\d{9}|\d{11})$/.test(buyerRnc) && !!buyerName.trim()
    : !!file && /\.(xlsx|xls)$/i.test(file.name) && file.size <= 10 * 1024 * 1024);

  return <PageTransition>
    <PageHeader eyebrow="DGII" title="Certificación como emisor electrónico"
      description="Sigue las 15 etapas del proceso y ejecuta las pruebas disponibles en la API. El avance confirmado se registra por empresa."
      actions={<Button asChild variant="outline"><Link to={ROUTES.app.dgii}><ShieldCheck /> Centro DGII</Link></Button>} />
    {progress.isLoading ? <LoadingState rows={8} /> : progress.error ? <div className="surface"><ErrorState error={progress.error} onRetry={() => void progress.refetch()} /></div> : <>
      <div className="mb-6 rounded-xl border bg-muted/30 p-4 text-sm">
        <p><strong>Ambiente activo:</strong> {progress.data?.environment ?? 'Sin configurar'}</p>
        {!enabled && <p className="mt-1 text-warning">Las pruebas envían datos al ambiente CerteCF. Solicita a LX la activación de ese ambiente antes de ejecutarlas.</p>}
        <p className="mt-1 text-muted-foreground">«Prueba ejecutada» refleja una respuesta de la API; «Confirmado» requiere revisión de superadmin. Los pasos posteriores pueden depender de trámites en el portal DGII.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(290px,360px)_minmax(0,1fr)]">
        <nav className="surface max-h-[75vh] overflow-y-auto p-3" aria-label="Etapas de certificación">
          <ol className="space-y-1">{CERTIFICATION_STEPS.map((title, index) => {
            const number = index + 1;
            const current = stepState(progress.data, number);
            const status = current?.status ?? 'PENDIENTE';
            return <li key={number}><button type="button" onClick={() => { setSelected(number); setFile(null); }}
              aria-current={selected === number ? 'step' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected === number ? 'bg-brand-soft text-foreground' : 'hover:bg-muted/50'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${status === 'CONFIRMADO' ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>{status === 'CONFIRMADO' ? <CheckCircle2 className="h-4 w-4" /> : number}</span>
              <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span><span className="text-xs text-muted-foreground">{statusMeta[status].label}</span></span>
            </button></li>;
          })}</ol>
        </nav>
        <section className="surface space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand">Etapa {selected} de 15</p><h2 className="mt-1 text-xl font-semibold">{CERTIFICATION_STEPS[selected - 1]}</h2></div><StatusBadge {...statusMeta[state?.status ?? 'PENDIENTE']} /></div>
          {state && <div className="rounded-lg border bg-muted/30 p-3 text-sm"><p>{state.summary}</p><p className="mt-1 text-xs text-muted-foreground">Actualizado {formatDateTime(state.updatedAt)}</p></div>}
          {(selected === 2 || selected === 3) && <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Carga la hoja Excel correspondiente. La API procesará las filas y enviará las pruebas al ambiente de certificación de la DGII.</p>
            <div className="space-y-2"><Label htmlFor="cert-excel">Archivo Excel (.xls o .xlsx; hasta 10 MB)</Label><Input id="cert-excel" type="file" accept=".xls,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
            <Button type="button" disabled={!canRun} onClick={() => setConfirm(true)}><FileSpreadsheet /> {selected === 2 ? 'Procesar datos e-CF' : 'Procesar aprobación comercial'}</Button>
            {selected === 2 && <div className="space-y-2 rounded-lg border p-3"><Label htmlFor="cert-xml">Firma individual de XML (opcional)</Label><Textarea id="cert-xml" value={xml} onChange={(event) => setXml(event.target.value)} rows={4} placeholder="Pega aquí el XML a firmar" /><Button variant="outline" size="sm" disabled={!enabled || !xml.trim() || sign.isPending} onClick={() => sign.mutate()}>{sign.isPending && <Loader2 className="animate-spin" />} Firmar y descargar XML</Button></div>}
          </div>}
          {selected === 4 && <div className="space-y-3">
            <p className="text-sm text-muted-foreground">La API generará y enviará 25 comprobantes de certificación. Usa un lote identificable; si la ejecución se interrumpe, conserva el mismo lote para reanudarla.</p>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="cert-lot">Lote</Label><Input id="cert-lot" value={lot} maxLength={40} onChange={(event) => setLot(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="cert-buyer-rnc">RNC o cédula del comprador</Label><Input id="cert-buyer-rnc" value={buyerRnc} onChange={(event) => setBuyerRnc(event.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="cert-buyer-name">Nombre del comprador</Label><Input id="cert-buyer-name" value={buyerName} maxLength={150} onChange={(event) => setBuyerName(event.target.value)} /></div>
            <Button type="button" disabled={!canRun} onClick={() => setConfirm(true)}>{execute.isPending && <Loader2 className="animate-spin" />} Ejecutar simulación e-CF</Button>
          </div>}
          {(selected === 1 || selected >= 5) && <CertificationStepTools key={selected} step={selected} lot={simulationLot}
            status={state?.status ?? 'PENDIENTE'} enabled={enabled} />}
          <Results step={selected} state={state} lot={(state?.result as CertificationSimulationResult | undefined)?.lote} onDownload={(order) => download.mutate(order)} downloading={download.isPending} />
        </section>
      </div>
    </>}
    <ConfirmDialog open={confirm} onOpenChange={(open) => !execute.isPending && setConfirm(open)}
      title="Enviar prueba de certificación a la DGII"
      description={selected === 4 ? 'Se generarán y enviarán hasta 25 e-CF al ambiente CerteCF. La operación puede tardar varios minutos.' : 'La API procesará el archivo y enviará sus comprobantes al ambiente CerteCF. Revisa que el archivo corresponda a esta empresa.'}
      confirmLabel="Ejecutar prueba" loading={execute.isPending} onConfirm={() => execute.mutate()} />
  </PageTransition>;
}
