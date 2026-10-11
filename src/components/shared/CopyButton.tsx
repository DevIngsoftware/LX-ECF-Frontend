import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/utils/download';
import { cn } from '@/lib/utils';

export function CopyButton({ value, label = 'Copiar', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const ok = await copyToClipboard(value);
    if (!ok) {
      toast.error('No se pudo copiar al portapapeles');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onCopy} className={cn('text-muted-foreground', className)} aria-label={copied ? 'Copiado' : label}>
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}
