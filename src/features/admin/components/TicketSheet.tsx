import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { adminService } from '@/services/api/platform';
import { errorMessage } from '@/services/http/errors';
import type { SupportTicket } from '@/types/platform';
import { formatDateTime } from '@/utils/format';
import { TICKET_STATUSES } from './admin-meta';

export function TicketSheet({ ticket, onOpenChange }: { ticket: SupportTicket | null; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [reply, setReply] = useState('');
  const detail = useQuery({
    queryKey: ['admin', 'tickets', ticket?.id],
    queryFn: () => adminService.ticket(ticket!.id),
    enabled: !!ticket,
  });
  const current = detail.data?.ticket ?? ticket;

  useEffect(() => {
    if (ticket) setStatus(ticket.status);
  }, [ticket]);

  useEffect(() => {
    if (detail.data) setStatus(detail.data.ticket.status);
  }, [detail.data]);

  const update = useMutation({
    mutationFn: (v: { id: string; status: string }) => adminService.updateTicket(v.id, v.status),
    onSuccess: () => {
      toast.success('Estado del ticket actualizado');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets', ticket?.id] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const send = useMutation({
    mutationFn: (v: { id: string; body: string }) => adminService.replyTicket(v.id, v.body),
    onSuccess: () => {
      setReply('');
      toast.success('Respuesta enviada');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Sheet open={!!ticket} onOpenChange={(o) => !update.isPending && !send.isPending && onOpenChange(o)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {current && (
          <>
            <SheetHeader className="border-b p-6 text-left">
              <p className="font-mono text-xs text-muted-foreground">{current.id}</p>
              <SheetTitle>{current.subject}</SheetTitle>
              <SheetDescription>{current.company}</SheetDescription>
            </SheetHeader>
            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Prioridad</dt>
                  <dd className="mt-1"><GenericStatusBadge status={current.priority} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Estado</dt>
                  <dd className="mt-1"><GenericStatusBadge status={current.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Creado</dt>
                  <dd className="mt-0.5">{formatDateTime(current.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Actualizado</dt>
                  <dd className="mt-0.5">{formatDateTime(current.updatedAt)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Asignado a</dt>
                  <dd className="mt-0.5 font-medium">{current.assignee ?? 'Sin asignar'}</dd>
                </div>
              </dl>

              <section aria-labelledby="conv-title" className="space-y-3">
                <h3 id="conv-title" className="text-sm font-semibold">Conversación</h3>
                {detail.isLoading && <p className="text-sm text-muted-foreground">Cargando conversación…</p>}
                {detail.isError && <p className="text-sm text-destructive">{errorMessage(detail.error)}</p>}
                <ol className="space-y-3">
                  {detail.data?.messages.map((message) => (
                    <li key={message.id} className="rounded-xl border bg-muted/40 p-3 text-sm">
                      <p className="text-xs text-muted-foreground">{message.author} · {formatDateTime(message.createdAt)}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
                    </li>
                  ))}
                </ol>
                <div className="space-y-2">
                  <Label htmlFor="ticket-reply">Responder a la empresa</Label>
                  <Textarea id="ticket-reply" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} rows={4} />
                  <Button type="button" onClick={() => send.mutate({ id: current.id, body: reply })}
                    disabled={!reply.trim() || send.isPending || !detail.data}>
                    {send.isPending && <Loader2 className="animate-spin" />} Enviar respuesta
                  </Button>
                </div>
              </section>

              <div className="space-y-2">
                <Label htmlFor="ticket-status">Cambiar estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="ticket-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="gap-2 border-t p-4 sm:space-x-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending || send.isPending}>Cerrar</Button>
              <Button onClick={() => update.mutate({ id: current.id, status })} disabled={update.isPending || status === current.status}>
                {update.isPending && <Loader2 className="animate-spin" />}
                Guardar estado
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
