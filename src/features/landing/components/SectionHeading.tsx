import type { ReactNode } from 'react';
import { Reveal } from '@/components/animations/motion';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  inverted?: boolean;
}

export function SectionHeading({ eyebrow, title, description, align = 'center', className, inverted }: SectionHeadingProps) {
  return (
    <Reveal className={cn('max-w-2xl space-y-4', align === 'center' && 'mx-auto text-center', className)}>
      <p className={cn('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand', align === 'center' && 'justify-center')}>
        <span className="h-px w-6 bg-brand" aria-hidden />
        {eyebrow}
      </p>
      <h2 className={cn('text-3xl font-extrabold sm:text-4xl', inverted && 'text-white')}>{title}</h2>
      {description && <p className={cn('text-base leading-relaxed sm:text-lg', inverted ? 'text-zinc-400' : 'text-muted-foreground')}>{description}</p>}
    </Reveal>
  );
}
