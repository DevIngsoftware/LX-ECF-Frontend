import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-foreground',
};

interface AuthHeaderProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  center?: boolean;
}

export function AuthHeader({ title, description, icon: Icon, tone = 'brand', center }: AuthHeaderProps) {
  return (
    <div className={cn('mb-8 space-y-3', center && 'text-center')}>
      {Icon && (
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', tones[tone], center && 'mx-auto')}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
