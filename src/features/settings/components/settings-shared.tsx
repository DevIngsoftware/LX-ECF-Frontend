import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { settingsService } from '@/services/api/account';
import { invoicesService } from '@/services/api/invoices';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { CompanySettings } from '@/types/account';

/** Lee la configuración de empresa y guarda cambios parciales fusionándolos con el estado actual. */
export function useCompanySettings() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.company, queryFn: settingsService.company });
  const save = useMutation({
    mutationFn: (patch: Partial<CompanySettings>) => {
      if (!query.data) throw new Error('La configuración aún no se ha cargado.');
      return settingsService.updateCompany({ ...query.data, ...patch });
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.company, data);
      void qc.invalidateQueries({ queryKey: queryKeys.company });
      void qc.invalidateQueries({ queryKey: queryKeys.settingsStatus });
      toast.success('Cambios guardados');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return { ...query, save };
}

export function useDgiiOverview() {
  return useQuery({ queryKey: queryKeys.dgii, queryFn: invoicesService.dgiiOverview });
}

export function SectionShell({ title, description, children, actions }: { title: string; description?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function SectionLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

export function SectionError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <ErrorState compact error={error} onRetry={onRetry} />;
}

export function SaveBar({ pending, dirty, onReset }: { pending: boolean; dirty: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onReset} disabled={!dirty || pending}>Descartar</Button>
      <Button type="submit" disabled={!dirty || pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios
      </Button>
    </div>
  );
}
