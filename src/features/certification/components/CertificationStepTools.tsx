import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { certificationService } from '@/services/api/certification';
import { errorMessage } from '@/services/http/errors';
import type { CertificationStepStatus } from '@/types/certification';
import { saveBlob } from '@/utils/download';
import { formatDateTime } from '@/utils/format';

const PORTAL = 'https://ecf.dgii.gov.do/certecf/portalcertificacion/login';
const GUIDE = 'https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Documentaciones%20Proceso%20de%20Certificaci%C3%B3n%20FE/Proceso%20de%20Certificacion%20para%20ser%20Emisor%20Electronico.pdf';

export function CertificationStepTools({ step, lot, status, enabled }: {
  step: number; lot?: string; status: CertificationStepStatus; enabled: boolean;
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [declaration, setDeclaration] = useState<File | null>(null);
  const urlEnvironment = step === 12 ? 'eCF' : 'CerteCF';
  const representations = useQuery({
    queryKey: ['certification', 'representations', lot],
    queryFn: () => certificationService.representations(lot!),
    enabled: step === 5 && !!lot,
  });
  const receptions = useQuery({
    queryKey: ['certification', 'receptions'], queryFn: certificationService.receptions,
    enabled: step === 9 || step === 11,
  });
  const urls = useQuery({ queryKey: ['certification', 'urls'], queryFn: certificationService.serviceUrls,
    enabled: step === 7 || step === 12 });
  const currentUrls = urls.data?.find((item) => item.environment === urlEnvironment);
  useEffect(() => { setBaseUrl(currentUrls?.baseUrl ?? ''); }, [currentUrls?.baseUrl, urlEnvironment]);

  const pdf = useMutation({
    mutationFn: (tipo: number) => certificationService.representationPdf(lot!, tipo),
    onSuccess: (blob, tipo) => saveBlob(blob, `representacion-${lot}-E${tipo}.pdf`),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const saveUrls = useMutation({
    mutationFn: () => certificationService.saveServiceUrls(urlEnvironment, baseUrl),
    onSuccess: () => { toast.success('Direcciones guardadas'); void qc.invalidateQueries({ queryKey: ['certification', 'urls'] }); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const sign = useMutation({
    mutationFn: async () => certificationService.signXml(await declaration!.text()),
    onSuccess: (signed) => { saveBlob(new Blob([signed], { type: 'application/xml' }), 'declaracion-jurada-firmada.xml'); toast.success('Declaración firmada'); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const evidence = useMutation({
    mutationFn: () => certificationService.submitEvidence(step, note.trim()),
    onSuccess: () => {
      setNote('');
      toast.success('Avance enviado para revisión');
      void qc.invalidateQueries({ queryKey: ['certification', 'progress'] });
      void qc.invalidateQueries({ queryKey: ['certification', 'receptions'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const guidance: Record<number, string> = {
    1: 'Completa la postulación en el portal de certificación DGII. Allí descargas el XML de postulación, lo firmas y lo vuelves a cargar.',
    5: 'Descarga una representación impresa por cada tipo de e-CF del lote de simulación. Revisa que el código QR apunte a CerteCF y carga los PDF (hasta 10 MB cada uno) en el portal DGII.',
    6: 'Espera el resultado de la DGII. Si rechaza un PDF, corrige la representación y vuelve a cargarla en su portal.',
    7: 'Registra en el portal DGII las direcciones públicas HTTPS de autenticación, recepción e-CF y aprobación comercial de pruebas.',
    8: 'En el portal DGII indica que estás listo para recibir los e-CF de prueba. Registra aquí ese inicio; a partir de ese momento se mostrarán las recepciones nuevas.',
    9: 'La DGII enviará e-CF a la URL de recepción. La API los conserva y devuelve un acuse de recibo firmado. Confirma en el portal DGII que la prueba fue aceptada.',
    10: 'En el portal DGII inicia la prueba de recepción de aprobaciones comerciales y registra aquí ese inicio.',
    11: 'La DGII enviará aprobaciones o rechazos comerciales a la URL configurada. La API conservará los XML recibidos y responderá al emisor.',
    12: 'Registra en el portal DGII las direcciones públicas HTTPS que usarás en producción. Confirma antes que el despliegue productivo está disponible.',
    13: 'Descarga la declaración jurada XML desde el portal DGII, fírmala con el certificado del representante y cárgala de nuevo allí.',
    14: 'La DGII verificará el RNC, el acceso a Oficina Virtual, las secuencias NCF y el representante registrado. Revisa el resultado en su portal.',
    15: 'Registra la autorización final cuando la DGII confirme el estado de emisor electrónico en la Oficina Virtual.',
  };

  const received = step === 9 ? receptions.data?.ecf : receptions.data?.approvals;
  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">{guidance[step]}</p>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-brand underline">
      <a href={PORTAL} target="_blank" rel="noopener noreferrer">Abrir portal de certificación DGII ↗</a>
      <a href={GUIDE} target="_blank" rel="noopener noreferrer">Guía oficial del proceso ↗</a>
    </div>

    {step === 5 && <div className="space-y-2 rounded-lg border p-3">
      <h3 className="font-semibold">PDF del lote {lot ?? 'sin simulación'}</h3>
      {!lot && <p className="text-sm text-muted-foreground">Completa primero el paso 4 para generar los comprobantes.</p>}
      {representations.isLoading && <p className="text-sm">Buscando comprobantes del lote…</p>}
      {representations.error && <p className="text-sm text-destructive">{errorMessage(representations.error)}</p>}
      {representations.data?.length === 0 && <p className="text-sm text-muted-foreground">No hay representaciones disponibles para este lote.</p>}
      <div className="flex flex-wrap gap-2">{representations.data?.map((item) => <Button key={item.tipo} variant="outline" size="sm" disabled={pdf.isPending}
        onClick={() => pdf.mutate(item.tipo)}><Download /> E{item.tipo} · {item.encf}</Button>)}</div>
    </div>}

    {(step === 7 || step === 12) && <div className="space-y-3 rounded-lg border p-3">
      <h3 className="font-semibold">Servicios {urlEnvironment === 'CerteCF' ? 'de prueba' : 'de producción'}</h3>
      <p className="text-xs text-muted-foreground">Usa la dirección pública de esta API, no la del frontend. Debe tener HTTPS y ser accesible desde la DGII.</p>
      <div className="space-y-2"><Label htmlFor="cert-base-url">URL base pública</Label><Input id="cert-base-url" value={baseUrl} placeholder="https://api.ejemplo.com" onChange={(event) => setBaseUrl(event.target.value)} /></div>
      <Button size="sm" disabled={saveUrls.isPending || !baseUrl.trim()} onClick={() => saveUrls.mutate()}>{saveUrls.isPending && <Loader2 className="animate-spin" />} Guardar direcciones</Button>
      {currentUrls && <dl className="space-y-2 break-all text-xs">
        <div><dt className="font-semibold">Autenticación</dt><dd>{currentUrls.authentication}</dd></div>
        <div><dt className="font-semibold">Recepción e-CF</dt><dd>{currentUrls.reception}</dd></div>
        <div><dt className="font-semibold">Aprobación comercial</dt><dd>{currentUrls.approval}</dd></div>
      </dl>}
      <p className="text-xs text-muted-foreground">Guardar aquí prepara los enlaces; también debes confirmarlos en el portal DGII.</p>
    </div>}

    {(step === 9 || step === 11) && <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Recepciones registradas ({received?.length ?? 0})</h3><Button size="sm" variant="outline" onClick={() => void receptions.refetch()}><RefreshCw /> Actualizar</Button></div>
      {receptions.isLoading && <p className="text-sm">Consultando recepciones…</p>}
      {receptions.error && <p className="text-sm text-destructive">{errorMessage(receptions.error)}</p>}
      {received?.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay recepciones desde el inicio de esta prueba.</p>}
      <ul className="max-h-56 divide-y overflow-y-auto text-sm">{received?.map((item, index) => <li key={`${item.encf}-${index}`} className="flex flex-wrap justify-between gap-2 py-2"><span>{item.encf}</span><span>{formatDateTime(item.receivedAt)}</span></li>)}</ul>
      <p className="text-xs text-muted-foreground">La API muestra recepciones posteriores al inicio registrado. La aceptación de la prueba se comprueba en el portal DGII.</p>
    </div>}

    {step === 13 && <div className="space-y-2 rounded-lg border p-3">
      <Label htmlFor="cert-declaration">XML de declaración jurada descargado de DGII</Label>
      <Input id="cert-declaration" type="file" accept=".xml,application/xml,text/xml" onChange={(event) => setDeclaration(event.target.files?.[0] ?? null)} />
      <Button variant="outline" size="sm" disabled={!enabled || !declaration || sign.isPending} onClick={() => sign.mutate()}>{sign.isPending && <Loader2 className="animate-spin" />} Firmar y descargar XML</Button>
      <p className="text-xs text-muted-foreground">Verifica que el certificado corresponda al representante autorizado antes de cargarlo en DGII.</p>
    </div>}

    {status !== 'CONFIRMADO' && <div className="space-y-2 rounded-lg border-t pt-4">
      <Label htmlFor="cert-evidence">{step === 8 || step === 10 ? 'Constancia de inicio en DGII' : 'Resultado o referencia en DGII'}</Label>
      <Textarea id="cert-evidence" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} rows={3}
        placeholder="Ej.: DGII aprobó la etapa el 12/10/2026; referencia de la postulación…" />
      <Button size="sm" disabled={evidence.isPending || !note.trim() || ((step === 8 || step === 10) && status === 'EJECUTADO')}
        onClick={() => evidence.mutate()}>{evidence.isPending && <Loader2 className="animate-spin" />} Enviar avance a revisión</Button>
      <p className="text-xs text-muted-foreground">Este registro no cambia el estado en la DGII. Superadmin verificará la constancia antes de confirmar la etapa aquí.</p>
    </div>}
  </div>;
}
