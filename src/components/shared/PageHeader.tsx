import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
