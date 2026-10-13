import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Loader2, SearchCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ENV } from '@/constants/env';
import { partiesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { Party, PartyInput, PartyKind } from '@/types/business';
import { PARTY_META, cleanRnc } from './party-meta';

const optionalText = z.string().trim().max(200, 'Máximo 200 caracteres');

const schema = z.object({
  rnc: z
    .string()
    .trim()
    .min(1, 'El RNC o la cédula es obligatorio')
    .refine((v) => /^(\d{9}|\d{11})$/.test(cleanRnc(v)), 'Debe tener 9 dígitos (RNC) u 11 dígitos (cédula)'),
  legalName: z.string().trim().min(2, 'Ingresa el nombre o razón social').max(150, 'Máximo 150 caracteres'),
  tradeName: optionalText,
  email: z.union([z.string().trim().email('Correo electrónico inválido'), z.literal('')]),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[\d\s()+-]{7,20}$/.test(v), 'Teléfono inválido'),
  address: optionalText,
  notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const toValues = (p?: Party | null): FormValues => ({
  rnc: p?.rnc ?? '',
  legalName: p?.legalName ?? '',
  tradeName: p?.tradeName ?? '',
  email: p?.email ?? '',
  phone: p?.phone ?? '',
  address: p?.address ?? '',
  notes: p?.notes ?? '',
  active: p?.active ?? true,
});

const orUndefined = (v: string) => (v.trim() === '' ? undefined : v.trim());

interface PartyFormSheetProps {
  kind: PartyKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: Party | null;
  onSaved?: (party: Party) => void;
}

export function PartyFormSheet({ kind, open, onOpenChange, party, onSaved }: PartyFormSheetProps) {
  const meta = PARTY_META[kind];
  const qc = useQueryClient();
  const isEdit = !!party;
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(party) });
  const [lookupNote, setLookupNote] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      form.reset(toValues(party));
      setLookupNote(null);
    }
  }, [open, party, form]);

  const lookup = useMutation({
    mutationFn: (rnc: string) => partiesService.lookupRnc(rnc),
    onSuccess: (res, searchedRnc) => {
      if (!open || cleanRnc(form.getValues('rnc')) !== searchedRnc) return;
      if (!res) {
        setLookupNote('No se encontraron datos para este documento. Completa la información manualmente.');
        return;
      }
      form.setValue('legalName', res.legalName, { shouldValidate: true, shouldDirty: true });
      if (res.tradeName) form.setValue('tradeName', res.tradeName, { shouldDirty: true });
      setLookupNote(res.status ? `Datos obtenidos. Estado del contribuyente: ${res.status}.` : 'Datos obtenidos correctamente.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onLookup = async () => {
    const ok = await form.trigger('rnc');
    if (!ok) return;
    lookup.mutate(cleanRnc(form.getValues('rnc')));
  };

  const save = useMutation({
    mutationFn: (input: PartyInput) => (party ? partiesService.update(kind, party.id, input) : partiesService.create(kind, input)),
    onSuccess: (saved) => {
      toast.success(isEdit ? `${meta.singularCap} actualizado` : `${meta.singularCap} creado`);
      void qc.invalidateQueries({ queryKey: ['parties', kind] });
      if (kind === 'customers') void qc.invalidateQueries({ queryKey: ['invoice-customers'] });
      void qc.invalidateQueries({ queryKey: queryKeys.party(kind, saved.id) });
      onSaved?.(saved);
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onSubmit = (v: FormValues) =>
    save.mutate({
      rnc: cleanRnc(v.rnc),
      legalName: v.legalName.trim(),
      tradeName: orUndefined(v.tradeName),
      email: orUndefined(v.email),
      phone: orUndefined(v.phone),
      address: orUndefined(v.address),
      notes: orUndefined(v.notes),
      active: v.active,
    });

  return (
    <Sheet open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle>{isEdit ? `Editar ${meta.singular}` : `Nuevo ${meta.singular}`}</SheetTitle>
          <SheetDescription>Los datos fiscales se usan al emitir y recibir comprobantes electrónicos.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-6">
              <FormField
                control={form.control}
                name="rnc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RNC o cédula</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} onChange={(event) => { field.onChange(event); setLookupNote(null); }}
                          inputMode="numeric" placeholder="101234567" className="font-mono" autoComplete="off" />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={onLookup} disabled={lookup.isPending}>
                        {lookup.isPending ? <Loader2 className="animate-spin" /> : <SearchCheck />}
                        Consultar
                      </Button>
                    </div>
                    <FormMessage />
                    {ENV.invoicesUseMocks && (
                      <FormDescription className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" aria-hidden /> Consulta ilustrativa: en modo demostración no se consulta el padrón real.
                      </FormDescription>
                    )}
                    {lookupNote && <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground animate-fade-up">{lookupNote}</p>}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre o razón social</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Empresa, S.R.L." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre comercial <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="correo@empresa.com" autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="809-555-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas internas</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Activo</FormLabel>
                      <FormDescription>Los registros inactivos no aparecen al emitir comprobantes.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="gap-2 border-t p-4 sm:space-x-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                {isEdit ? 'Guardar cambios' : `Crear ${meta.singular}`}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
