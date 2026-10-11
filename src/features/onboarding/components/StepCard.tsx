import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StepProps<T> {
  defaultValues: T;
  onSubmit: (values: T) => void;
}

export function StepCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <header className="flex items-start gap-4 border-b bg-muted/30 p-5 sm:p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
