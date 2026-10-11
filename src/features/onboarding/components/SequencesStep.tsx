import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Hash, Info, ListOrdered, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ECF_TYPES } from '@/constants/ecf';
import { sequencesSchema, STEP_FORM_ID, type SequencesStepValues } from '../schemas';
import { StepCard, type StepProps } from './StepCard';

const preview = (type: string, n: string) => (type && /^\d+$/.test(n) ? `${type}${n.padStart(10, '0')}` : '—');

export function SequencesStep({ defaultValues, onSubmit, usedTypes = [] }: StepProps<SequencesStepValues> & { usedTypes?: string[] }) {
  const reduce = useReducedMotion();
  const form = useForm<SequencesStepValues>({ resolver: zodResolver(sequencesSchema), defaultValues });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const items = useWatch({ control: form.control, name: 'items' }) ?? [];
  const used = new Set(items.map((i) => i.type));
  const nextType = ECF_TYPES.find((t) => !used.has(t.code))?.code ?? '';
  const rootError = form.formState.errors.items?.root?.message ?? form.formState.errors.items?.message;

  return (
    <StepCard icon={ListOrdered} title="Secuencias e-NCF" description="Registra los rangos de numeración autorizados por la DGII para cada tipo de comprobante.">
      <Form {...form}>
        <form id={STEP_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {fields.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Hash className="h-5 w-5 text-muted-foreground" aria-hidden /></span>
              <div>
                <p className="font-semibold">Sin secuencias registradas</p>
                <p className="mt-1 text-sm text-muted-foreground">Agrega al menos una para poder emitir. Si aún no las tienes, continúa y regístralas después.</p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {fields.map((f, index) => {
              const row = items[index];
              return (
                <motion.div
                  key={f.id}
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border bg-background/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                      <FormField
                        control={form.control}
                        name={`items.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2 lg:col-span-1">
                            <FormLabel>Tipo de e-CF</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ECF_TYPES.map((t) => (
                                  <SelectItem key={t.code} value={t.code} disabled={used.has(t.code) && t.code !== field.value}>
                                    {t.code} · {t.short}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.from`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desde</FormLabel>
                            <FormControl><Input inputMode="numeric" maxLength={10} placeholder="1" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.to`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hasta</FormLabel>
                            <FormControl><Input inputMode="numeric" maxLength={10} placeholder="1000" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.expiresAt`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vencimiento</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={usedTypes.includes(row?.type)} title={usedTypes.includes(row?.type) ? 'Una secuencia utilizada no se puede eliminar' : undefined} aria-label="Eliminar secuencia" className="text-muted-foreground hover:text-destructive">
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    {row && (
                      <p className="mt-3 font-mono text-xs text-muted-foreground">
                        {preview(row.type, row.from)} <span className="font-sans">a</span> {preview(row.type, row.to)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {rootError && <p className="text-sm font-medium text-destructive">{rootError}</p>}

          <Button
            type="button"
            variant="outline"
            disabled={!nextType}
            onClick={() => append({ type: nextType, from: '1', to: '', expiresAt: '' })}
          >
            <Plus /> Agregar secuencia
          </Button>

          <div className="flex gap-3 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
            <p className="leading-relaxed text-muted-foreground">
              Los rangos deben coincidir con las autorizaciones emitidas por la DGII para tu RNC. El backend validará cada secuencia antes de usarla.
            </p>
          </div>
        </form>
      </Form>
    </StepCard>
  );
}
