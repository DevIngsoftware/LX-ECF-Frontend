import { FlaskConical } from 'lucide-react';
import { ENV } from '@/constants/env';

export function DemoBanner() {
  if (!ENV.useMocks) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-center text-xs text-white">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
      <span>
        <strong className="font-semibold">Módulos pendientes:</strong> {ENV.invoicesUseMocks ? 'facturas y otras secciones aún muestran datos de demostración.' : 'otras secciones aún muestran datos de demostración.'} La cuenta, la configuración fiscal{ENV.invoicesUseMocks ? '' : ' y los comprobantes'} ya usan la API.
      </span>
    </div>
  );
}
