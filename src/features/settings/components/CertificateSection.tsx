import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileKey2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { formatDate } from '@/utils/format';
import { SectionError, SectionLoading, SectionShell, useDgiiOverview } from './settings-shared';

export function CertificateSection() {
  const { data, isLoading, error, refetch } = useDgiiOverview();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const upload = useMutation({
    mutationFn: () => settingsService.uploadCertificate({ file: file!, password }),
    onSuccess: () => {
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      void qc.invalidateQueries({ queryKey: queryKeys.dgii });
      void qc.invalidateQueries({ queryKey: queryKeys.settingsStatus });
      void qc.invalidateQueries({ queryKey: queryKeys.onboarding });
      toast.success('Certificado actualizado y validado');
    },
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: () => setPassword(''),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !/\.(p12|pfx)$/i.test(file.name) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      toast.error('Selecciona un certificado .p12 o .pfx de hasta 5 MB');
      return;
    }
    if (!password) { toast.error('Ingresa la contraseña del certificado'); return; }
    upload.mutate();
  };

  return <SectionShell title="Certificado digital" description="Consulta el certificado actual y reemplázalo cuando se renueve o cambie.">
    {isLoading ? <SectionLoading /> : error ? <SectionError error={error} onRetry={() => void refetch()} /> : <div className="space-y-6">
      {data?.certificate ? <dl className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Titular</dt><dd className="font-medium">{data.certificate.subject}</dd></div>
        <div><dt className="text-muted-foreground">Emisor</dt><dd className="font-medium">{data.certificate.issuer}</dd></div>
        <div><dt className="text-muted-foreground">Vence</dt><dd className="font-medium">{formatDate(data.certificate.validTo)}</dd></div>
      </dl> : <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">Aún no hay un certificado válido registrado.</p>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border p-4" noValidate>
        <div className="flex items-center gap-2 font-semibold"><FileKey2 className="h-4 w-4" /> {data?.certificate ? 'Reemplazar certificado' : 'Cargar certificado'}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="certificate-file">Archivo .p12 o .pfx</Label><Input ref={fileInput} id="certificate-file" type="file" accept=".p12,.pfx,application/x-pkcs12" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
          <div className="space-y-2"><Label htmlFor="certificate-password">Contraseña del archivo</Label><PasswordInput id="certificate-password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        </div>
        <p className="text-xs text-muted-foreground">La contraseña se envía a la API para validar el archivo y se borra del formulario después de cada intento.</p>
        <Button type="submit" disabled={upload.isPending}>{upload.isPending && <Loader2 className="animate-spin" />} {upload.isPending ? 'Validando...' : 'Guardar certificado'}</Button>
      </form>
    </div>}
  </SectionShell>;
}
