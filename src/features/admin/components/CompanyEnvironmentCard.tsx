import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ServerCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { AdminCompany } from '@/types/platform';

const environments = [
  { value: 'TesteCF', label: 'Pruebas (TesteCF)' },
  { value: 'CerteCF', label: 'Certificación (CerteCF)' },
  { value: 'eCF', label: 'Producción (eCF)' },
] as const;
type Environment = (typeof environments)[number]['value'];
const label = (value?: string) => environments.find((item) => item.value === value)?.label ?? value ?? 'Sin definir';

export function CompanyEnvironmentCard({ company }: { company: AdminCompany }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Environment>(() =>
    environments.some((item) => item.value === company.dgiiEnvironment)
      ? company.dgiiEnvironment as Environment : 'TesteCF');
  const [confirmed, setConfirmed] = useState(false);
  const requested = company.requestedDgiiEnvironment ?? 'TesteCF';
  const allowed = selected === 'TesteCF' || selected === requested;
  const change = useMutation({
    mutationFn: () => adminService.activateEnvironment(company.rnc, selected, selected === 'TesteCF' || confirmed),
    onSuccess: () => {
      setConfirmed(false);
      void qc.invalidateQueries({ queryKey: queryKeys.admin.company(company.id) });
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'company', company.id, 'certification'] });
      toast.success('Ambiente DGII actualizado');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return <section className="surface space-y-4 p-5 lg:col-span-2">
    <div><h2 className="flex items-center gap-2 font-semibold"><ServerCog className="h-4 w-4" /> Ambiente DGII de la empresa</h2>
      <p className="mt-1 text-sm text-muted-foreground">El cambio afecta los próximos comprobantes. Confirma la habilitación fiscal antes de activar certificación o producción.</p></div>
    <div className="grid gap-2 text-sm sm:grid-cols-2">
      <p><strong>Activo:</strong> {label(company.dgiiEnvironment)}</p>
      <p><strong>Solicitado por la empresa:</strong> {label(requested)}</p>
    </div>
    <div className="max-w-sm space-y-2"><Label htmlFor="admin-environment">Ambiente a activar</Label>
      <select id="admin-environment" value={selected} onChange={(event) => { setSelected(event.target.value as Environment); setConfirmed(false); }} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        {environments.map((env) => <option key={env.value} value={env.value}>{env.label}</option>)}
      </select>
    </div>
    {!allowed && <p className="text-sm text-warning">La empresa debe solicitar este ambiente desde su Configuración DGII antes de activarlo.</p>}
    {selected !== 'TesteCF' && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /> Confirmo que la empresa está habilitada por la DGII para este ambiente.</label>}
    <Button type="button" disabled={change.isPending || !allowed || selected === company.dgiiEnvironment || (selected !== 'TesteCF' && !confirmed)} onClick={() => change.mutate()}>{change.isPending && <Loader2 className="animate-spin" />} Activar ambiente</Button>
  </section>;
}
