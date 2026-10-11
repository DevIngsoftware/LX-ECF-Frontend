import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CopyButton } from '@/components/shared/CopyButton';
import { developersService } from '@/services/api/platform';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import type { CreatedCredential } from '@/types/platform';

const schema = z.object({
  name: z.string().trim().min(3, 'Ingresa un nombre de al menos 3 caracteres').max(60, 'Máximo 60 caracteres'),
  environment: z.enum(['sandbox', 'production'], { required_error: 'Selecciona un ambiente' }),
});

type FormValues = z.infer<typeof schema>;
const DEFAULTS: FormValues = { name: '', environment: 'sandbox' };

export function CreateCredentialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [created, setCreated] = useState<CreatedCredential | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
      setCreated(null);
    }
  }, [open, form]);

  const create = useMutation({
    mutationFn: (v: FormValues) => developersService.createCredential(v.name.trim(), v.environment),
    onSuccess: (res) => {
      setCreated(res);
      toast.success('Credencial creada');
      void qc.invalidateQueries({ queryKey: queryKeys.credentials });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const close = () => {
    // El secreto se descarta al cerrar: nunca se guarda en el cliente.
    setCreated(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : !create.isPending && close())}>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Guarda tu secreto ahora</DialogTitle>
              <DialogDescription>Credencial «{created.credential.name}» creada. Este secreto no volverá a mostrarse.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <code className="min-w-0 flex-1 break-all font-mono text-xs">{created.secret}</code>
                <CopyButton value={created.secret} label="Copiar secreto" />
              </div>
              <div className="flex gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <p>Guárdalo en un gestor de secretos de tu servidor. Si lo pierdes, revoca esta credencial y crea una nueva.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={close}>Ya lo guardé</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nueva credencial de API</DialogTitle>
              <DialogDescription>Usa credenciales separadas para cada sistema que integres.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ERP interno" autoComplete="off" />
                      </FormControl>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sandbox">Pruebas</SelectItem>
                          <SelectItem value="production">Producción</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={close} disabled={create.isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending && <Loader2 className="animate-spin" />}
                    Crear credencial
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
