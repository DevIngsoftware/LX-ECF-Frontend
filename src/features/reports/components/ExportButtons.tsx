import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileSpreadsheet, FileText, FileType2, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportsService } from '@/services/api/operations';
import { errorMessage } from '@/services/http/errors';
import type { ExportFormat, ReportKey } from '@/types/business';
import type { DateRange } from '@/types/common';
import { toInputDate } from '@/utils/dates';
import { saveBlob } from '@/utils/download';

const FORMATS: { format: ExportFormat; label: string; icon: LucideIcon }[] = [
  { format: 'csv', label: 'CSV', icon: FileType2 },
  { format: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF', icon: FileText },
];

export function ExportButtons({ reportKey, range, disabled }: { reportKey: ReportKey; range: DateRange; disabled?: boolean }) {
  const mutation = useMutation({
    mutationFn: (format: ExportFormat) => reportsService.export(reportKey, format, range),
    onSuccess: (blob, format) => {
      saveBlob(blob, `reporte-${reportKey}-${toInputDate(range.from)}_${toInputDate(range.to)}.${format}`);
      toast.success('Reporte exportado');
    },
    onError: (err) => toast.error('No se pudo exportar el reporte', { description: errorMessage(err) }),
  });

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Exportar reporte">
      {FORMATS.map(({ format, label, icon: Icon }) => {
        const pending = mutation.isPending && mutation.variables === format;
        return (
          <Button key={format} variant="outline" size="sm" className="h-10" disabled={disabled || mutation.isPending} onClick={() => mutation.mutate(format)}>
            {pending ? <Loader2 className="animate-spin" /> : <Icon />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
