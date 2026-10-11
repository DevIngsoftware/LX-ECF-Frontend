import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { PlatformSettings } from '@/types/platform';

export function AdminSettingsPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.admin.settings, queryFn: adminService.settings });
  const [form, setForm] = useState<PlatformSettings | null>(null);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  const save = useMutation({
    mutationFn: (values: PlatformSettings) => adminService.saveSettings(values),
    onSuccess: (values) => { qc.setQueryData(queryKeys.admin.settings, values); toast.success('Configuración guardada'); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (form) save.mutate(form); };

  return <PageTransition>
    <PageHeader eyebrow="Administración" title="Configuración de plataforma" description="Opciones generales de LX e-CF en modo demostración." />
    {query.isLoading || !form && !query.error ? <LoadingState rows={5} /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : form && (
      <form onSubmit={submit} className="surface max-w-3xl space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="platform-name">Nombre de plataforma</Label><Input id="platform-name" value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="support-email">Correo de soporte</Label><Input id="support-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="trial-days">Duración de prueba (días)</Label><Input id="trial-days" type="number" min={0} max={365} value={form.defaultTrialDays} onChange={(e) => setForm({ ...form, defaultTrialDays: Number(e.target.value) })} required /></div>
        </div>
        <div className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="self-signup">Registro público</Label><p className="text-sm text-muted-foreground">Permitir que nuevas empresas creen una cuenta.</p></div><Switch id="self-signup" checked={form.allowSelfSignup} onCheckedChange={(checked) => setForm({ ...form, allowSelfSignup: checked })} /></div>
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="maintenance">Modo mantenimiento</Label><p className="text-sm text-muted-foreground">Indicador visual del estado de mantenimiento.</p></div><Switch id="maintenance" checked={form.maintenanceMode} onCheckedChange={(checked) => setForm({ ...form, maintenanceMode: checked })} /></div>
        </div>
        <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios</Button></div>
      </form>
    )}
  </PageTransition>;
}
