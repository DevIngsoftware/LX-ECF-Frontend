import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DatePreset, DateRange } from '@/types/common';
import { DATE_PRESET_LABELS, fromInputDate, rangeFromPreset, toInputDate } from '@/utils/dates';

interface DateRangeFilterProps {
  preset: DatePreset;
  range: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
}

const PRESETS: Exclude<DatePreset, 'custom'>[] = ['today', '7d', 'month', 'year'];

export function DateRangeFilter({ preset, range, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(toInputDate(range.from));
  const [to, setTo] = useState(toInputDate(range.to));
  const invalid = !from || !to || from > to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        value={preset === 'custom' ? '' : preset}
        onValueChange={(v) => v && onChange(v as DatePreset, rangeFromPreset(v as Exclude<DatePreset, 'custom'>))}
        className="rounded-lg border bg-card p-1"
        aria-label="Período"
      >
        {PRESETS.map((p) => (
          <ToggleGroupItem key={p} value={p} className="h-8 rounded-md px-3 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background">
            {DATE_PRESET_LABELS[p]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={preset === 'custom' ? 'default' : 'outline'} size="sm" className="h-10">
            <CalendarRange />
            {preset === 'custom' ? `${toInputDate(range.from)} → ${toInputDate(range.to)}` : 'Rango personalizado'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="range-from">Desde</Label>
              <Input id="range-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="range-to">Hasta</Label>
              <Input id="range-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {from > to && <p className="text-xs text-destructive">La fecha inicial debe ser anterior a la final.</p>}
          <Button
            className="w-full"
            disabled={invalid}
            onClick={() => {
              onChange('custom', { from: fromInputDate(from), to: fromInputDate(to, true) });
              setOpen(false);
            }}
          >
            Aplicar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
