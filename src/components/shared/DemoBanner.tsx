import { FlaskConical } from 'lucide-react';
import { ENV } from '@/constants/env';

export function DemoBanner() {
  if (!ENV.useMocks) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-center text-xs text-white">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
      <span>
        <strong className="font-semibold">Modo demostración:</strong> configura VITE_API_BASE_URL y desactiva VITE_USE_MOCKS para trabajar con tu cuenta y los datos reales de la API.
      </span>
    </div>
  );
}
