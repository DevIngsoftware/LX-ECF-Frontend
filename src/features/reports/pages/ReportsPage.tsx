import { useState } from 'react';
import { Info } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ModuleNotContracted } from '@/components/shared/states';
import { DateRangeFilter } from '@/components/forms/DateRangeFilter';
import { useAuth } from '@/features/auth/auth-context';
import type { ReportKey } from '@/types/business';
import type { DatePreset, DateRange } from '@/types/common';
import { rangeFromPreset } from '@/utils/dates';
import { REPORT_MAP } from '../components/report-meta';
import { ReportSelector } from '../components/ReportSelector';
import { ReportView } from '../components/ReportView';
import { ExportButtons } from '../components/ExportButtons';
import { FiscalFormatsCard } from '../components/FiscalFormatsCard';

export function ReportsPage() {
  const { hasModule } = useAuth();
  const [reportKey, setReportKey] = useState<ReportKey>('sales');
  const [preset, setPreset] = useState<DatePreset>('year');
  const [range, setRange] = useState<DateRange>(() => rangeFromPreset('year'));

  const isLocked = (key: ReportKey) => {
    const m = REPORT_MAP[key].module;
    return !!m && !hasModule(m);
  };
  const lockedModule = isLocked(reportKey) ? REPORT_MAP[reportKey].module : undefined;

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Ventas, impuestos y operación de tu empresa por período."
        actions={<ExportButtons reportKey={reportKey} range={range} disabled={!!lockedModule} />}
      />

      <div className="mb-6">
        <DateRangeFilter
          preset={preset}
          range={range}
          onChange={(p, r) => {
            setPreset(p);
            setRange(r);
          }}
        />
      </div>

      <div className="mb-6">
        <ReportSelector value={reportKey} onChange={setReportKey} isLocked={isLocked} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {lockedModule ? (
            <div className="surface">
              <ModuleNotContracted module={lockedModule} />
            </div>
          ) : (
            <ReportView key={reportKey} reportKey={reportKey} range={range} />
          )}
        </div>
        <aside className="space-y-6">
          <FiscalFormatsCard />
          <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>Los reportes son informativos y se basan en los datos registrados en la plataforma. La información fiscal oficial es la que consta en la DGII.</p>
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
