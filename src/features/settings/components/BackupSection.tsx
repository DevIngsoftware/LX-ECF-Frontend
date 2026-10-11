import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Download, Loader2, LockKeyhole, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { useAuth } from '@/features/auth/auth-context';
import { settingsService, type BackupImportResult, type BackupPreview } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { SectionError, SectionLoading, SectionShell } from './settings-shared';

export function BackupSection() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const company = useQuery({ queryKey: queryKeys.company, queryFn: settingsService.company });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const importFileInput = useRef<HTMLInputElement>(null);
  const [importPassword, setImportPassword] = useState('');
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [lastImport, setLastImport] = useState<BackupImportResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const exportBackup = useMutation({
    mutationFn: () => settingsService.exportBackup(password),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LX-ECF-${company.data?.rnc ?? 'empresa'}-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success('Copia de seguridad descargada');
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => { setPassword(''); setConfirmation(''); },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 12 || password.length > 128) {
      toast.error('Usa una contraseña de 12 a 128 caracteres');
      return;
    }
    if (password !== confirmation) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    exportBackup.mutate();
  };

  const inspect = useMutation({
    mutationFn: () => {
      if (!importFile) throw new Error('Selecciona un archivo ZIP');
      return settingsService.previewBackup(importFile, importPassword);
    },
    onMutate: () => { setPreview(null); setConfirmed(false); },
    onSuccess: (result) => { setPreview(result); setConfirmed(false); toast.success('Respaldo verificado'); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const restore = useMutation({
    mutationFn: () => {
      if (!importFile || !preview) throw new Error('Verifica el respaldo antes de importarlo');
      return settingsService.importBackup(importFile, importPassword, preview.sha256);
    },
    onSuccess: (result) => {
      const count = Object.values(result.inserted).reduce((sum, value) => sum + value, 0);
      toast.success(`Importación terminada: ${count} registros incorporados`);
      setLastImport(result);
      setPreview(null); setImportFile(null); setImportPassword(''); setConfirmed(false);
      if (importFileInput.current) importFileInput.current.value = '';
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const changeFile = (file: File | null) => { setImportFile(file); setPreview(null); setLastImport(null); setConfirmed(false); };
  const changePassword = (value: string) => { setImportPassword(value); setPreview(null); setConfirmed(false); };

  return <SectionShell title="Copia de seguridad de la empresa" description="Exporta e importa tus datos en un ZIP cifrado con AES-256.">
    {company.isLoading ? <SectionLoading /> : company.error ? <SectionError error={company.error} onRetry={() => void company.refetch()} /> : <div className="space-y-6">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl border p-4"><Archive className="mb-2 h-5 w-5 text-brand" /><p className="font-medium">Contenido</p><p className="mt-1 text-muted-foreground">Datos de {company.data?.legalName}, comprobantes, XML, representaciones PDF disponibles, clientes, catálogo, pagos y archivos asociados. El manifiesto indica si algún PDF no se pudo generar.</p></div>
        <div className="rounded-xl border p-4"><LockKeyhole className="mb-2 h-5 w-5 text-brand" /><p className="font-medium">Protección</p><p className="mt-1 text-muted-foreground">La copia no incluye contraseñas, tokens, secretos de API ni el certificado digital. Guarda la contraseña elegida: LX no podrá recuperarla.</p></div>
      </div>
      {hasPermission('settings.manage') ? <form onSubmit={submit} className="max-w-xl space-y-4" noValidate>
        <div className="space-y-2"><Label htmlFor="backup-password">Contraseña para abrir el ZIP</Label><PasswordInput id="backup-password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={exportBackup.isPending} /><p className="text-xs text-muted-foreground">Mínimo 12 caracteres. La preparación puede tardar varios minutos. Para abrirlo, usa una aplicación compatible con ZIP AES-256, como 7-Zip o WinRAR.</p></div>
        <div className="space-y-2"><Label htmlFor="backup-confirmation">Repite la contraseña</Label><PasswordInput id="backup-confirmation" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={exportBackup.isPending} /></div>
        <Button type="submit" disabled={exportBackup.isPending}>{exportBackup.isPending ? <Loader2 className="animate-spin" /> : <Download />} {exportBackup.isPending ? 'Preparando copia…' : 'Descargar copia cifrada'}</Button>
      </form> : <p className="text-sm text-muted-foreground">Solo un administrador de la empresa puede descargar una copia.</p>}
      {hasPermission('settings.manage') && <div className="space-y-4 border-t pt-6">
        <div><h3 className="font-semibold">Importar copia</h3><p className="mt-1 text-sm text-muted-foreground">Solo se aceptan copias de esta empresa. Primero verificamos la integridad del ZIP y mostramos una vista previa.</p></div>
        <div className="grid max-w-xl gap-4">
          <div className="space-y-2"><Label htmlFor="backup-file">Archivo ZIP cifrado</Label><Input ref={importFileInput} id="backup-file" type="file" accept=".zip,application/zip" onChange={(event) => changeFile(event.target.files?.[0] ?? null)} disabled={inspect.isPending || restore.isPending} /><p className="text-xs text-muted-foreground">Hasta 512 MB de contenido. Conserva siempre el ZIP original y su contraseña.</p></div>
          <div className="space-y-2"><Label htmlFor="backup-import-password">Contraseña del ZIP</Label><PasswordInput id="backup-import-password" value={importPassword} onChange={(event) => changePassword(event.target.value)} disabled={inspect.isPending || restore.isPending} /></div>
          <Button type="button" variant="outline" disabled={!importFile || !importPassword || inspect.isPending || restore.isPending} onClick={() => inspect.mutate()}>{inspect.isPending ? <Loader2 className="animate-spin" /> : <Archive />} {inspect.isPending ? 'Verificando…' : 'Ver vista previa'}</Button>
        </div>
        {preview && <div className="space-y-4 rounded-xl border p-4 text-sm">
          <div><p className="font-medium">Respaldo de {preview.companyRnc}</p><p className="text-muted-foreground">Creado: {new Date(preview.createdAt).toLocaleString('es-DO')}</p></div>
          <div className="grid gap-2 sm:grid-cols-2">{Object.entries(preview.available).filter(([, count]) => count > 0).map(([table, count]) => <p key={table} className="rounded-md bg-muted px-3 py-2"><span className="font-medium">{table.replace(/_/g, ' ')}</span>: {count} en copia · {preview.existing[table] ?? 0} actuales</p>)}</div>
          {preview.warnings.map((warning) => <p key={warning} className="text-muted-foreground">• {warning}</p>)}
          <p className="text-muted-foreground">Se conservan: {preview.preserved.join(', ')}. Los PDF generados permanecen en el ZIP; los XML de nuevos comprobantes se incorporan al servidor.</p>
          <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>Revisé la vista previa y acepto incorporar los registros faltantes. Los e-NCF existentes no se sobrescribirán.</span></label>
          <Button type="button" disabled={!confirmed || restore.isPending} onClick={() => restore.mutate()}>{restore.isPending ? <Loader2 className="animate-spin" /> : <Upload />} {restore.isPending ? 'Importando…' : 'Importar registros faltantes'}</Button>
        </div>}
        {lastImport && <div className="space-y-2 rounded-xl border border-success/40 p-4 text-sm"><p className="font-semibold">Importación terminada</p><div className="grid gap-1 sm:grid-cols-2">{Object.entries(lastImport.inserted).filter(([, count]) => count > 0).map(([table, count]) => <p key={table}>{table.replace(/_/g, ' ')}: {count} incorporados</p>)}</div>{lastImport.advancedSequences > 0 && <p>{lastImport.advancedSequences} secuencia(s) actualizada(s) sin retroceder.</p>}{lastImport.warnings.map((warning) => <p key={warning} className="text-muted-foreground">• {warning}</p>)}<p className="text-muted-foreground">Puedes consultar los módulos para verificar los datos recuperados.</p></div>}
      </div>}
    </div>}
  </SectionShell>;
}
