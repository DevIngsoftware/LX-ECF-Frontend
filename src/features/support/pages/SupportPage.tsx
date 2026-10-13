import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LifeBuoy, Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supportService } from '@/services/api/platform';
import { errorMessage } from '@/services/http/errors';
import { formatDateTime } from '@/utils/format';
import { TICKET_PRIORITIES } from '@/features/admin/components/admin-meta';
import { DepositRequestDialog } from '@/features/subscription/components/DepositRequestDialog';
import { MODULE_LABELS } from '@/features/admin/components/admin-meta';

export function SupportPage() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('MEDIA');
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [attachProof, setAttachProof] = useState(false);
  const list = useQuery({ queryKey: ['support', 'tickets'], queryFn: supportService.tickets });
  const detail = useQuery({
    queryKey: ['support', 'ticket', selected],
    queryFn: () => supportService.ticket(selected!),
    enabled: !!selected,
  });

  const create = useMutation({
    mutationFn: () => supportService.create(subject, priority, body),
    onSuccess: ({ ticket }) => {
      toast.success('Ticket enviado a soporte');
      setSubject('');
      setBody('');
      setPriority('MEDIA');
      setSelected(ticket.id);
      void qc.invalidateQueries({ queryKey: ['support'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const send = useMutation({
    mutationFn: () => supportService.reply(selected!, reply),
    onSuccess: () => {
      setReply('');
      toast.success('Respuesta enviada');
      void qc.invalidateQueries({ queryKey: ['support'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <PageTransition>
      <PageHeader eyebrow="Mi cuenta" title="Soporte" description="Comunícate con el equipo de LX e-CF y sigue tus solicitudes." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="surface space-y-4 p-5" aria-labelledby="new-ticket-title">
          <h2 id="new-ticket-title" className="flex items-center gap-2 font-semibold"><LifeBuoy className="h-4 w-4" /> Nuevo ticket</h2>
          <div className="space-y-2">
            <Label htmlFor="support-subject">Asunto</Label>
            <Input id="support-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} placeholder="Describe brevemente la solicitud" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-priority">Prioridad</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="support-priority"><SelectValue /></SelectTrigger>
              <SelectContent>{TICKET_PRIORITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-message">Mensaje</Label>
            <Textarea id="support-message" rows={6} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder="Cuéntanos qué ocurrió y qué necesitas." />
          </div>
          <Button onClick={() => create.mutate()} disabled={!subject.trim() || !body.trim() || create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />} Enviar ticket
          </Button>
        </section>

        <section className="surface space-y-4 p-5" aria-labelledby="ticket-list-title">
          <h2 id="ticket-list-title" className="font-semibold">Mis tickets</h2>
          {list.isLoading && <p className="text-sm text-muted-foreground">Cargando tickets…</p>}
          {list.isError && <p className="text-sm text-destructive">{errorMessage(list.error)}</p>}
          {list.data?.content.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay tickets. Puedes crear el primero con el formulario.</p>}
          <div className="space-y-2">
            {list.data?.content.map((ticket) => (
              <button key={ticket.id} type="button" onClick={() => setSelected(ticket.id)}
                className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                aria-pressed={selected === ticket.id}>
                <div className="flex items-center justify-between gap-3"><span className="font-medium">#{ticket.id} · {ticket.subject}</span><GenericStatusBadge status={ticket.status} /></div>
                <p className="mt-1 text-xs text-muted-foreground">Actualizado {formatDateTime(ticket.updatedAt)}</p>
              </button>
            ))}
          </div>
          {list.data && list.data.totalPages > 1 && <p className="text-xs text-muted-foreground">Mostrando los 20 tickets más recientes.</p>}
        </section>
      </div>

      {selected && (
        <section className="surface mt-6 space-y-4 p-5" aria-labelledby="ticket-detail-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ticket-detail-title" className="font-semibold">Conversación del ticket #{selected}</h2>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Cerrar</Button>
          </div>
          {detail.isLoading && <p className="text-sm text-muted-foreground">Cargando conversación…</p>}
          {detail.isError && <p className="text-sm text-destructive">{errorMessage(detail.error)}</p>}
          {detail.data && (
            <>
              <p className="text-sm text-muted-foreground">{detail.data.ticket.subject} · <GenericStatusBadge status={detail.data.ticket.status} /></p>
              {detail.data.paymentRequest ? <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Comprobante de depósito: {detail.data.paymentRequest.status === 'PENDING' ? 'pendiente de validación' : detail.data.paymentRequest.status === 'APPROVED' ? 'aprobado' : 'rechazado'}</p>
                <p>RD$ {Number(detail.data.paymentRequest.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })} · {detail.data.paymentRequest.bankName}</p>
                {detail.data.paymentRequest.planId && <p>Plan solicitado por {detail.data.paymentRequest.termMonths} {detail.data.paymentRequest.termMonths === 1 ? 'mes' : 'meses'}.</p>}
                {detail.data.paymentRequest.reviewNote && <p>Motivo: {detail.data.paymentRequest.reviewNote}</p>}
              </div> : detail.data.moduleRequest && ['ABIERTO', 'EN_PROGRESO'].includes(detail.data.ticket.status) && <div className="rounded-lg border border-brand/30 p-3 text-sm">
                <p className="mb-2">Para habilitar el módulo, adjunta tu comprobante de depósito. Superadmin lo verificará.</p>
                <Button type="button" onClick={() => setAttachProof(true)}>Adjuntar comprobante</Button>
              </div>}
              <ol className="space-y-3">
                {detail.data.messages.map((message) => (
                  <li key={message.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">{message.author} · {formatDateTime(message.createdAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{message.body}</p>
                  </li>
                ))}
              </ol>
              <div className="space-y-2">
                <Label htmlFor="support-reply">Responder</Label>
                <Textarea id="support-reply" rows={4} maxLength={4000} value={reply} onChange={(e) => setReply(e.target.value)} />
                <Button onClick={() => send.mutate()} disabled={!reply.trim() || send.isPending}>
                  {send.isPending && <Loader2 className="animate-spin" />} Enviar respuesta
                </Button>
              </div>
            </>
          )}
        </section>
      )}
      {attachProof && detail.data?.moduleRequest && selected && <DepositRequestDialog open={attachProof}
        onOpenChange={setAttachProof} kind="MODULE" targetId={detail.data.moduleRequest.key}
        targetName={MODULE_LABELS[detail.data.moduleRequest.key] ?? detail.data.moduleRequest.key}
        needsPlan={!detail.data.moduleRequest.subscriptionActive} existingTicketId={selected}
        onSubmitted={() => void qc.invalidateQueries({ queryKey: ['support', 'ticket', selected] })} />}
    </PageTransition>
  );
}
