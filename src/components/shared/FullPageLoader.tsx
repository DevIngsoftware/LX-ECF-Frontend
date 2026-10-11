import { COMPANY } from '@/constants/env';

export function FullPageLoader({ label = 'Cargando LX e-CF…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-brand/30 animate-pulse-ring" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border bg-card shadow-card">
          <img src={COMPANY.logo} alt="" className="h-6 w-auto" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
