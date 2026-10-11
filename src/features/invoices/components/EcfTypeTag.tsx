import { ECF_TYPE_MAP } from '@/constants/ecf';
import type { EcfTypeCode } from '@/types/ecf';
import { cn } from '@/lib/utils';

export function EcfTypeTag({ type, showName = true, className }: { type: EcfTypeCode; showName?: boolean; className?: string }) {
  const meta = ECF_TYPE_MAP[type];
  return (
    <span className={cn('inline-flex items-center gap-2', className)} title={meta?.name}>
      <span className="rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[11px] font-semibold text-background">{type}</span>
      {showName && <span className="text-muted-foreground">{meta?.short ?? type}</span>}
    </span>
  );
}
