import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Encabezado de una sección de documentación. */
export function DocHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: ReactNode }) {
  return (
    <header className="mb-8 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
    </header>
  );
}

/** Bloque titulado dentro de una sección. */
export function DocBlock({ title, description, children, className, id }: { title?: string; description?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn('mb-8 space-y-4', className)}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

type CalloutTone = 'info' | 'warning' | 'brand';

const calloutTone: Record<CalloutTone, string> = {
  info: 'border-info/30 bg-info-soft text-info',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  brand: 'border-brand/30 bg-brand-soft text-brand',
};

export function Callout({ tone = 'info', title, children, icon }: { tone?: CalloutTone; title?: string; children: ReactNode; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'warning' ? AlertTriangle : Info);
  return (
    <div className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', calloutTone[tone])} role="note">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-foreground/80">{children}</div>
      </div>
    </div>
  );
}

/** Código en línea. */
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{children}</code>;
}

/** Tabla simple de documentación con scroll horizontal en móvil. */
export function DocTable({ headers, rows, minWidth = 560 }: { headers: string[]; rows: ReactNode[][]; minWidth?: number }) {
  return (
    <div className="surface overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead className="bg-muted/50">
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col" className="h-10 whitespace-nowrap px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t align-top">
                {r.map((c, j) => (
                  <td key={j} className="px-4 py-3">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
