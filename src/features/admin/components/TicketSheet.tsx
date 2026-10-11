import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MessageSquareText } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { adminService } from '@/services/api/platform';
import { errorMessage } from '@/services/http/errors';
import type { SupportTicket } from '@/types/platform';
import { formatDateTime } from '@/utils/format';
import { TICKET_STATUSES, labelOf, TICKET_PRIORITIES } from './admin-meta';

export function TicketSheet({ ticket, onOpenChange }: { ticket: SupportTicket | null; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (ticket) setStatus(ticket.status);
  }, [ticket]);

  const update = useMutation({
    mutationFn: (v: { id: string; status: string }) => adminService.updateTicket(v.id, v.status),
    onSuccess: () => {
      toast.success('Estado del ticket actualizado');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Sheet open={!!ticket} onOpenChange={(o) => !update.isPending && onOpenChange(o)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {ticket && (
          <>
            <SheetHeader className="border-b p-6 text-left">
              <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
              <SheetTitle>{ticket.subject}</SheetTitle>
              <SheetDescription>{ticket.company}</SheetDescription>
            </SheetHeader>
            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Prioridad</dt>
                  <dd className="mt-1"><GenericStatusBadge status={ticket.priority} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Estado</dt>
                  <dd className="mt-1"><GenericStatusBadge status={ticket.status} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Creado</dt>
                  <dd className="mt-0.5">{formatDateTime(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Actualizado</dt>
                  <dd className="mt-0.5">{formatDateTime(ticket.updatedAt)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Asignado a</dt>
                  <dd className="mt-0.5 font-medium">{ticket.assignee ?? 'Sin asignar'}</dd>
                </div>
              </dl>

              <section aria-labelledby="conv-title" className="space-y-3">
                <h3 id="conv-title" className="text-sm font-semibold">Conversación</h3>
                <ol className="space-y-3">
                  <li className="rounded-xl border bg-muted/40 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">{ticket.company} · {formatDateTime(ticket.createdAt)}</p>
                    <p className="mt-1">Ticket abierto: «{ticket.subject}». Prioridad {labelOf(TICKET_PRIORITIES, ticket.priority).toLowerCase()}.</p>
                  </li>
                </ol>
                <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  El historial de mensajes y las respuestas estarán disponibles cuando el servicio de soporte exponga la conversación del ticket.
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
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>Cerrar</Button>
              <Button onClick={() => update.mutate({ id: ticket.id, status })} disabled={update.isPending || status === ticket.status}>
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
