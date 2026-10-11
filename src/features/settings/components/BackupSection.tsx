import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Archive, Download, Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { useAuth } from '@/features/auth/auth-context';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { SectionError, SectionLoading, SectionShell } from './settings-shared';

export function BackupSection() {
  const { hasPermission } = useAuth();
  const company = useQuery({ queryKey: queryKeys.company, queryFn: settingsService.company });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
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

  return <SectionShell title="Copia de seguridad de la empresa" description="Descarga tus datos y archivos en un ZIP cifrado con AES-256.">
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
      <p className="text-xs text-muted-foreground">La importación con verificación de datos y secuencias estará disponible en la siguiente etapa.</p>
    </div>}
  </SectionShell>;
}
