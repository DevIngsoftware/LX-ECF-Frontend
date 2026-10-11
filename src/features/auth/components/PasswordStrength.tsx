import { cn } from '@/lib/utils';

function passwordScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(4, Math.max(1, score - (value.length < 8 ? 1 : 0)));
}

const LEVELS = [
  { label: 'Muy débil', bar: 'bg-destructive', text: 'text-destructive' },
  { label: 'Débil', bar: 'bg-destructive', text: 'text-destructive' },
  { label: 'Aceptable', bar: 'bg-warning', text: 'text-warning' },
  { label: 'Buena', bar: 'bg-info', text: 'text-info' },
  { label: 'Fuerte', bar: 'bg-success', text: 'text-success' },
];

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const level = LEVELS[score];
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-colors duration-300', i <= score ? level.bar : 'bg-muted')} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? (
          <>Seguridad: <span className={cn('font-medium', level.text)}>{level.label}</span>. Combina mayúsculas, números y símbolos.</>
        ) : (
          'Mínimo 8 caracteres. Combina mayúsculas, números y símbolos.'
        )}
      </p>
    </div>
  );
}
