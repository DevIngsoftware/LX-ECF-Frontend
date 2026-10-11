import { cn } from '@/lib/utils';

const METHOD_TONE: Record<string, string> = {
  GET: 'bg-info-soft text-info',
  POST: 'bg-success-soft text-success',
  PUT: 'bg-warning-soft text-warning',
  PATCH: 'bg-warning-soft text-warning',
  DELETE: 'bg-destructive-soft text-destructive',
};

export function MethodBadge({ method, className }: { method: string; className?: string }) {
  const m = method.toUpperCase();
  return (
    <span className={cn('inline-flex min-w-[3.5rem] items-center justify-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide', METHOD_TONE[m] ?? 'bg-muted text-muted-foreground', className)}>
      {m}
    </span>
  );
}

export function HttpStatusBadge({ status }: { status: number }) {
  const tone = status >= 500 ? 'bg-destructive-soft text-destructive' : status >= 400 ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success';
  return <span className={cn('inline-flex rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums', tone)}>{status}</span>;
}
