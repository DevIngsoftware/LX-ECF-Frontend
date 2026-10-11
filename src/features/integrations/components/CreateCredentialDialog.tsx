import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { CreatedCredential } from '@/types/platform';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().trim().min(3, 'Ingresa un nombre de al menos 3 caracteres').max(60, 'Máximo 60 caracteres'),
  environment: z.enum(['sandbox', 'production'], { required_error: 'Selecciona el ambiente' }),
});
type Values = z.infer<typeof schema>;

const ENVIRONMENTS = [
  { value: 'sandbox', label: 'Sandbox', hint: 'Pruebas sin efecto fiscal.' },
  { value: 'production', label: 'Producción', hint: 'Emisión real ante la DGII.' },
] as const;

export function CreateCredentialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [created, setCreated] = useState<CreatedCredential | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', environment: 'sandbox' } });

  const create = useMutation({
    mutationFn: (v: Values) => developersService.createCredential(v.name, v.environment),
    onSuccess: (res) => {
      setCreated(res);
      void qc.invalidateQueries({ queryKey: queryKeys.credentials });
      toast.success('Credencial creada');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const close = () => {
    // El secreto se descarta de la memoria al cerrar el diálogo.
    setCreated(null);
    setAcknowledged(false);
    form.reset({ name: '', environment: 'sandbox' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !create.isPending && (!created || acknowledged)) close(); }}>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Guarda tu secreto ahora</DialogTitle>
              <DialogDescription>Credencial «{created.credential.name}» creada. Este secreto solo se mostrará una vez.</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
              <p className="text-muted-foreground">
                Cópialo y guárdalo en un gestor de secretos. LX no puede volver a mostrarlo. Si lo pierdes, revoca esta credencial y crea una nueva.
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Secreto</p>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pl-3">
                <code className="min-w-0 flex-1 break-all font-mono text-xs">{created.secret}</code>
                <CopyButton value={created.secret} label="Copiar secreto" />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} />
              Ya guardé el secreto en un lugar seguro
            </label>
            <DialogFooter>
              <Button onClick={close} disabled={!acknowledged}>Listo</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nueva credencial de API</DialogTitle>
              <DialogDescription>Las credenciales permiten que tus sistemas emitan y consulten e-CF mediante la API de LX.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form id="create-credential" onSubmit={form.handleSubmit((v) => create.mutate(v))} noValidate className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Ej.: ERP principal" autoComplete="off" {...field} /></FormControl>
                      <FormDescription>Te ayuda a identificar qué sistema usa la credencial.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambiente</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
                          {ENVIRONMENTS.map((e) => (
                            <label
                              key={e.value}
                              className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors', field.value === e.value ? 'border-brand bg-brand-soft/40' : 'hover:bg-muted/50')}
                            >
                              <RadioGroupItem value={e.value} className="mt-0.5" />
                              <span>
                                <span className="block text-sm font-medium">{e.label}</span>
                                <span className="block text-xs text-muted-foreground">{e.hint}</span>
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={create.isPending}>Cancelar</Button>
              <Button type="submit" form="create-credential" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
                Crear credencial
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
