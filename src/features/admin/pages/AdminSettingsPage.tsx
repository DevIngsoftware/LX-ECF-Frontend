import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
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
import type { BankAccount, PlatformSettings } from '@/types/platform';

function BankAccountsSettings() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'bank-accounts'], queryFn: adminService.bankAccounts });
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  useEffect(() => { if (query.data) setAccounts(query.data); }, [query.data]);
  const save = useMutation({
    mutationFn: () => adminService.saveBankAccounts(accounts),
    onSuccess: (saved) => {
      qc.setQueryData(['admin', 'bank-accounts'], saved);
      void qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Cuentas bancarias publicadas');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const change = (index: number, patch: Partial<BankAccount>) => setAccounts((current) => current.map((account, i) => i === index ? { ...account, ...patch } : account));
  const add = () => setAccounts((current) => [...current, { id: '', bankName: '', accountType: 'Corriente', accountNumber: '', beneficiary: '', currency: 'DOP', active: true, sortOrder: current.length }]);

  return <section className="surface mt-6 max-w-3xl space-y-5 p-6">
    <div><h2 className="font-semibold">Cuentas para depósitos</h2><p className="text-sm text-muted-foreground">Estas cuentas se mostrarán a las empresas al solicitar planes o módulos. Si una cuenta ya tiene depósitos asociados, despublícala y agrega una nueva para cambiar sus datos.</p></div>
    {query.isLoading && <LoadingState rows={2} />}
    {query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
    {accounts.map((account, index) => <div key={account.id || `new-${index}`} className="space-y-3 rounded-xl border p-4">
      <h3 className="text-sm font-semibold">Cuenta {index + 1}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Banco</Label><Input value={account.bankName} onChange={(event) => change(index, { bankName: event.target.value })} maxLength={100} /></div>
        <div className="space-y-1"><Label>Tipo de cuenta</Label><Input value={account.accountType} onChange={(event) => change(index, { accountType: event.target.value })} maxLength={40} /></div>
        <div className="space-y-1"><Label>Número de cuenta</Label><Input value={account.accountNumber} onChange={(event) => change(index, { accountNumber: event.target.value })} maxLength={50} /></div>
        <div className="space-y-1"><Label>Titular</Label><Input value={account.beneficiary} onChange={(event) => change(index, { beneficiary: event.target.value })} maxLength={160} /></div>
        <div className="space-y-1"><Label>Moneda</Label><Input value={account.currency} onChange={(event) => change(index, { currency: event.target.value })} maxLength={10} /></div>
        <div className="flex items-center gap-3 pt-5"><Switch checked={account.active} onCheckedChange={(active) => change(index, { active })} /><Label>Publicada</Label></div>
      </div>
    </div>)}
    <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={add}><Plus /> Agregar cuenta</Button><Button type="button" onClick={() => save.mutate()} disabled={save.isPending || accounts.some((a) => !a.bankName.trim() || !a.accountType.trim() || !a.accountNumber.trim() || !a.beneficiary.trim())}>{save.isPending && <Loader2 className="animate-spin" />} Guardar cuentas</Button></div>
  </section>;
}

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
    <PageHeader eyebrow="Administración" title="Configuración de plataforma" description="Opciones generales de LX e-CF." />
    {query.isLoading || !form && !query.error ? <LoadingState rows={5} /> : query.error ? <ErrorState error={query.error} onRetry={() => void query.refetch()} /> : form && (
      <form onSubmit={submit} className="surface max-w-3xl space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="platform-name">Nombre de plataforma</Label><Input id="platform-name" value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="support-email">Correo de soporte</Label><Input id="support-email" type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} required /></div>
          <div className="space-y-2"><Label htmlFor="trial-days">Duración de prueba (días)</Label><Input id="trial-days" type="number" min={0} max={365} value={form.defaultTrialDays} onChange={(e) => setForm({ ...form, defaultTrialDays: Number(e.target.value) })} required /></div>
        </div>
        <div className="space-y-3 border-t pt-5">
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="self-signup">Registro público</Label><p className="text-sm text-muted-foreground">Permitir que nuevas empresas creen una cuenta.</p></div><Switch id="self-signup" checked={form.allowSelfSignup} onCheckedChange={(checked) => setForm({ ...form, allowSelfSignup: checked })} /></div>
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="maintenance">Modo mantenimiento</Label><p className="text-sm text-muted-foreground">Estado administrativo de mantenimiento; no interrumpe las operaciones fiscales.</p></div><Switch id="maintenance" checked={form.maintenanceMode} onCheckedChange={(checked) => setForm({ ...form, maintenanceMode: checked })} /></div>
        </div>
        <div className="flex justify-end border-t pt-5"><Button type="submit" disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios</Button></div>
      </form>
    )}
    <BankAccountsSettings />
  </PageTransition>;
}
