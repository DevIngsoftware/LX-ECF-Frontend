import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DGII_STATUS_META, ECF_TYPES, INTERNAL_STATUS_META } from '@/constants/ecf';
import type { DatePreset, DateRange } from '@/types/common';
import type { EcfTypeCode, InvoiceFilters } from '@/types/ecf';
import { DATE_PRESET_LABELS, fromInputDate, rangeFromPreset, toInputDate } from '@/utils/dates';
import { cn } from '@/lib/utils';

export type DateFilterPreset = DatePreset | 'all';

export interface InvoiceFilterState {
  type: EcfTypeCode | 'ALL';
  internalStatus: string;
  dgiiStatus: string;
  datePreset: DateFilterPreset;
  range: DateRange | null;
}

export const EMPTY_FILTERS: InvoiceFilterState = { type: 'ALL', internalStatus: 'ALL', dgiiStatus: 'ALL', datePreset: 'all', range: null };

export function toServiceFilters(f: InvoiceFilterState): InvoiceFilters {
  return {
    type: f.type,
    internalStatus: f.internalStatus === 'ALL' ? undefined : f.internalStatus,
    dgiiStatus: f.dgiiStatus === 'ALL' ? undefined : f.dgiiStatus,
    from: f.range?.from,
    to: f.range?.to,
  };
}

export function activeFilterCount(f: InvoiceFilterState): number {
  return [f.type !== 'ALL', f.internalStatus !== 'ALL', f.dgiiStatus !== 'ALL', f.datePreset !== 'all'].filter(Boolean).length;
}

interface Props {
  value: InvoiceFilterState;
  onChange: (next: InvoiceFilterState) => void;
  layout: 'inline' | 'stacked';
}

const DATE_OPTIONS: DateFilterPreset[] = ['all', 'today', '7d', 'month', 'year', 'custom'];

export function InvoiceFilterFields({ value, onChange, layout }: Props) {
  const stacked = layout === 'stacked';
  const set = (patch: Partial<InvoiceFilterState>) => onChange({ ...value, ...patch });
  const trigger = cn('h-10', stacked ? 'w-full' : 'w-40');

  const onDatePreset = (p: DateFilterPreset) => {
    if (p === 'all') return set({ datePreset: 'all', range: null });
    if (p === 'custom') {
      const base = value.range ?? rangeFromPreset('month');
      return set({ datePreset: 'custom', range: base });
    }
    set({ datePreset: p, range: rangeFromPreset(p) });
  };

  const setCustom = (key: 'from' | 'to', input: string) => {
    if (!input || !value.range) return;
    set({ range: { ...value.range, [key]: fromInputDate(input, key === 'to') } });
  };

  const field = (id: string, label: string, node: ReactNode) =>
    stacked ? (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {node}
      </div>
    ) : (
      node
    );

  return (
    <div className={cn(stacked ? 'space-y-4' : 'flex flex-wrap items-center gap-2')}>
      {field('f-type', 'Tipo de e-CF', (
        <Select value={value.type} onValueChange={(v) => set({ type: v as InvoiceFilterState['type'] })}>
          <SelectTrigger id="f-type" className={trigger} aria-label="Tipo de e-CF"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {ECF_TYPES.map((t) => <SelectItem key={t.code} value={t.code}>{t.code} · {t.short}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {field('f-internal', 'Estado interno', (
        <Select value={value.internalStatus} onValueChange={(v) => set({ internalStatus: v })}>
          <SelectTrigger id="f-internal" className={trigger} aria-label="Estado interno"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Estado interno: todos</SelectItem>
            {Object.entries(INTERNAL_STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {field('f-dgii', 'Estado DGII', (
        <Select value={value.dgiiStatus} onValueChange={(v) => set({ dgiiStatus: v })}>
          <SelectTrigger id="f-dgii" className={trigger} aria-label="Estado DGII"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Estado DGII: todos</SelectItem>
            {Object.entries(DGII_STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {field('f-date', 'Fecha de emisión', (
        <Select value={value.datePreset} onValueChange={(v) => onDatePreset(v as DateFilterPreset)}>
          <SelectTrigger id="f-date" className={trigger} aria-label="Fecha de emisión"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p === 'all' ? 'Todas las fechas' : DATE_PRESET_LABELS[p]}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {value.datePreset === 'custom' && value.range && (
        <div className={cn('grid grid-cols-2 gap-2', !stacked && 'w-72')}>
          <Input type="date" aria-label="Desde" className="h-10" value={toInputDate(value.range.from)} onChange={(e) => setCustom('from', e.target.value)} />
          <Input type="date" aria-label="Hasta" className="h-10" value={toInputDate(value.range.to)} onChange={(e) => setCustom('to', e.target.value)} />
          {value.range.from > value.range.to && <p className="col-span-2 text-xs text-destructive">La fecha inicial debe ser anterior a la final.</p>}
        </div>
      )}
    </div>
  );
}
