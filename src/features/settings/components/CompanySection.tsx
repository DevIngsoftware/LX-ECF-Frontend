import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { settingsService } from '@/services/api/account';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { CompanySettings } from '@/types/account';
import { SaveBar, SectionError, SectionLoading, SectionShell, useCompanySettings } from './settings-shared';

const schema = z.object({
  legalName: z.string().trim().min(3, 'Ingresa la razón social').max(150, 'Máximo 150 caracteres'),
  tradeName: z.string().trim().max(150, 'Máximo 150 caracteres'),
  email: z.string().trim().min(1, 'Ingresa el correo').email('Correo electrónico no válido'),
  phone: z.string().trim().max(20, 'Máximo 20 caracteres').refine((v) => v === '' || /^[\d\s()+-]{7,20}$/.test(v), 'Teléfono no válido'),
  address: z.string().trim().max(250, 'Máximo 250 caracteres'),
});
type Values = z.infer<typeof schema>;

const toValues = (data?: CompanySettings): Values => ({
  legalName: data?.legalName ?? '',
  tradeName: data?.tradeName ?? '',
  email: data?.email ?? '',
  phone: data?.phone ?? '',
  address: data?.address ?? '',
});

export function CompanySection() {
  const { data, isLoading, error, refetch, save } = useCompanySettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [savedPreview, setSavedPreview] = useState<string | null>(null);
  const logo = useQuery({ queryKey: queryKeys.companyLogo, queryFn: settingsService.logo, enabled: !!data?.logoPresent, retry: false });
  const uploadLogo = useMutation({
    mutationFn: settingsService.uploadLogo,
    onSuccess: async () => {
      await logo.refetch();
      setSelectedFile(null);
      if (fileInput.current) fileInput.current.value = '';
      toast.success('Logo guardado. Se usará en los PDF de la empresa.');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { legalName: '', tradeName: '', email: '', phone: '', address: '' } });

  useEffect(() => {
    if (!selectedFile) { setSelectedPreview(null); return; }
    const url = URL.createObjectURL(selectedFile);
    setSelectedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!logo.data) { setSavedPreview(null); return; }
    const url = URL.createObjectURL(logo.data);
    setSavedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo.data]);

  useEffect(() => {
    if (data) form.reset(toValues(data));
  }, [data, form]);

  const onSubmit = (v: Values) =>
    save.mutate({ ...v, tradeName: v.tradeName || undefined, phone: v.phone || undefined, address: v.address || undefined });

  return (
    <SectionShell title="Datos de empresa" description="Información que aparece en tus comprobantes y comunicaciones.">
      {isLoading ? (
        <SectionLoading />
      ) : error ? (
        <SectionError error={error} onRetry={() => void refetch()} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="rounded-xl border p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-2">
                  {selectedPreview || savedPreview
                    ? <img src={selectedPreview ?? savedPreview ?? ''} alt="Logo de la empresa" className="max-h-full max-w-full object-contain" />
                    : <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden />}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label htmlFor="company-logo" className="text-sm font-medium">Logo de la empresa</label>
                  <p className="text-sm text-muted-foreground">PNG, JPG o GIF, hasta 5 MB. Se verá en los PDF de tus comprobantes.</p>
                  <Input id="company-logo" ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif" disabled={uploadLogo.isPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                        toast.error('Selecciona una imagen PNG, JPG o GIF de hasta 5 MB.');
                        event.target.value = '';
                        setSelectedFile(null);
                        return;
                      }
                      setSelectedFile(file);
                    }} />
                  {selectedFile && <p className="text-xs text-muted-foreground">Vista previa: {selectedFile.name}</p>}
                  {logo.isError && data?.logoPresent && !selectedPreview && <p className="text-xs text-destructive">No se pudo cargar el logo guardado. Puedes volver a subirlo.</p>}
                  <Button type="button" variant="outline" disabled={!selectedFile || uploadLogo.isPending}
                    onClick={() => selectedFile && uploadLogo.mutate(selectedFile)}>
                    {uploadLogo.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                    {data?.logoPresent || logo.data ? 'Cambiar logo' : 'Agregar logo'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="legalName" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Razón social</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tradeName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre comercial <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo de facturación</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Input type="tel" placeholder="809-000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Dirección <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <SaveBar pending={save.isPending} dirty={form.formState.isDirty} onReset={() => form.reset(toValues(data))} />
          </form>
        </Form>
      )}
    </SectionShell>
  );
}
