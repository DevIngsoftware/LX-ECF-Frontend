import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileKey2, KeyRound, Loader2, Lock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { settingsService } from '@/services/api/account';
import { errorMessage } from '@/services/http/errors';
import { cn } from '@/lib/utils';
import { STEP_FORM_ID, type CertificateStepValues } from '../schemas';
import { StepCard, type StepProps } from './StepCard';

const MAX_SIZE = 5 * 1024 * 1024;

const uploadSchema = z.object({
  file: z
    .custom<File>((v) => v instanceof File, 'Selecciona el archivo del certificado.')
    .refine((f) => /\.(p12|pfx)$/i.test(f.name), 'El archivo debe ser .p12 o .pfx.')
    .refine((f) => f.size > 0 && f.size <= MAX_SIZE, 'El archivo debe pesar menos de 5 MB.'),
  password: z.string().min(1, 'Ingresa la contraseña del certificado.'),
});
type UploadValues = z.infer<typeof uploadSchema>;

export function CertificateStep({ defaultValues, onSubmit }: StepProps<CertificateStepValues>) {
  const [result, setResult] = useState<CertificateStepValues>(defaultValues);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<UploadValues>({ resolver: zodResolver(uploadSchema), defaultValues: { password: '' } });

  const upload = useMutation({
    mutationFn: (v: UploadValues) => settingsService.uploadCertificate({ file: v.file, password: v.password }),
    onSuccess: (_, v) => {
      setUploadError(null);
      setResult({ status: 'uploaded', fileName: v.file.name });
      toast.success('Certificado enviado para validación.');
    },
    onError: (err, v) => {
      setUploadError(errorMessage(err));
      setResult({ status: 'pending', fileName: v.file.name });
    },
    // La contraseña se descarta del formulario tras cada intento.
    onSettled: () => form.setValue('password', ''),
  });

  const startUpload = form.handleSubmit((v) => upload.mutate(v));

  return (
    <StepCard
      icon={FileKey2}
      title="Certificado digital"
      description="El certificado de firma digital (.p12 o .pfx) se usa para firmar cada comprobante antes de enviarlo a la DGII."
    >
      <form id={STEP_FORM_ID} onSubmit={(e) => { e.preventDefault(); onSubmit(result); }} noValidate className="space-y-5">
        <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <p className="leading-relaxed text-muted-foreground">
            La contraseña se envía una sola vez de forma segura al backend de LX para validar el certificado. No se almacena en tu navegador ni en este asistente.
          </p>
        </div>

        <Form {...form}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Archivo del certificado</FormLabel>
                  <FormControl>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-brand/50 hover:bg-brand-soft/30',
                        field.value ? 'border-foreground/30' : 'border-border',
                      )}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium">{field.value ? field.value.name : 'Selecciona tu archivo .p12 o .pfx'}</span>
                      <span className="text-xs text-muted-foreground">Tamaño máximo: 5 MB</span>
                    </button>
                  </FormControl>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".p12,.pfx,application/x-pkcs12"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={(e) => field.onChange(e.target.files?.[0])}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña del certificado</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="off"
                      placeholder="Contraseña del archivo"
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void startUpload();
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>Se descarta después de cada intento.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-start sm:pt-8">
              <Button type="button" variant="secondary" className="w-full" onClick={() => void startUpload()} disabled={upload.isPending}>
                {upload.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
                {upload.isPending ? 'Validando...' : 'Cargar certificado'}
              </Button>
            </div>
          </div>
        </Form>

        {result.status === 'uploaded' && (
          <Alert className="border-success/30 bg-success-soft">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Certificado recibido</AlertTitle>
            <AlertDescription className="text-muted-foreground">{result.fileName} fue enviado para validación. LX confirmará su vigencia.</AlertDescription>
          </Alert>
        )}

        {uploadError && result.status !== 'uploaded' && (
          <Alert className="border-warning/40 bg-warning-soft">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle>No se pudo cargar el certificado</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {uploadError} Puedes continuar con la configuración; este paso quedará marcado como pendiente.
            </AlertDescription>
          </Alert>
        )}

        {result.status === 'pending' && !uploadError && (
          <p className="text-xs text-muted-foreground">Si aún no tienes el certificado, continúa y cárgalo más tarde desde Configuración. Este paso quedará como pendiente.</p>
        )}
      </form>
    </StepCard>
  );
}
