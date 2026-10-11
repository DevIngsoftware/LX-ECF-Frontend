import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GenericStatusBadge } from '@/components/shared/StatusBadge';
import { adminService } from '@/services/api/platform';
import { useAuth } from '@/features/auth/auth-context';
import { errorMessage } from '@/services/http/errors';
import type { SupportTicket } from '@/types/platform';
import { formatDateTime } from '@/utils/format';
import { saveBlob } from '@/utils/download';
import { MODULE_LABELS, TICKET_STATUSES } from './admin-meta';

export function TicketSheet({ ticket, onOpenChange }: { ticket: SupportTicket | null; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canValidate = user?.role === 'SUPERADMIN';
  const [status, setStatus] = useState('');
  const [reply, setReply] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [environmentConfirmed, setEnvironmentConfirmed] = useState(false);
  const detail = useQuery({
    queryKey: ['admin', 'tickets', ticket?.id],
    queryFn: () => adminService.ticket(ticket!.id),
    enabled: !!ticket,
  });
  const current = detail.data?.ticket ?? ticket;

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setEnvironmentConfirmed(false);
    }
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

  const approve = useMutation({
    mutationFn: (id: string) => adminService.approveDeposit(id),
    onSuccess: () => {
      setApproveOpen(false);
      toast.success('Depósito validado y acceso activado');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets', ticket?.id] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: (id: string) => adminService.rejectDeposit(id, rejectReason),
    onSuccess: () => {
      setRejectReason('');
      toast.success('Depósito rechazado; la empresa fue notificada');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets', ticket?.id] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const proof = useMutation({
    mutationFn: (id: string) => adminService.depositProof(id),
    onSuccess: (blob) => saveBlob(blob, detail.data?.paymentRequest?.filename ?? 'comprobante'),
    onError: (err) => toast.error(errorMessage(err)),
  });
  const approveEnvironment = useMutation({
    mutationFn: (id: string) => adminService.approveEnvironmentRequest(id, environmentConfirmed),
    onSuccess: () => {
      setEnvironmentConfirmed(false);
      toast.success('Ambiente DGII activado; solicitud resuelta');
      void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'companies'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const environmentLabel = (environment?: string) => ({ TesteCF: 'Pruebas', CerteCF: 'Certificación', eCF: 'Producción' })[environment as 'TesteCF' | 'CerteCF' | 'eCF'] ?? environment;

  return (
    <Sheet open={!!ticket} onOpenChange={(o) => !update.isPending && !send.isPending && !approve.isPending && !approveEnvironment.isPending && onOpenChange(o)}>
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

      {detail.data?.paymentRequest && (
        <section className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/30 p-4 text-sm">
          <h3 className="font-semibold">Depósito para validar</h3>
          <p>{detail.data.paymentRequest.kind === 'PLAN' ? `Plan ${detail.data.paymentRequest.planName}` : `Módulo ${detail.data.paymentRequest.moduleKey ? MODULE_LABELS[detail.data.paymentRequest.moduleKey] ?? detail.data.paymentRequest.moduleKey : ''}`}
            {detail.data.paymentRequest.kind === 'MODULE' && detail.data.paymentRequest.planName ? ` con plan ${detail.data.paymentRequest.planName}` : ''}</p>
          <p>RD$ {Number(detail.data.paymentRequest.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })} · {detail.data.paymentRequest.bankName} · {detail.data.paymentRequest.accountNumber}</p>
          {detail.data.paymentRequest.reference && <p>Referencia: {detail.data.paymentRequest.reference}</p>}
          <p>Estado: {detail.data.paymentRequest.status}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => proof.mutate(current.id)} disabled={proof.isPending}><Download /> Descargar comprobante</Button>
          {canValidate && detail.data.paymentRequest.status === 'PENDING' && current.status !== 'CERRADO' && <div className="space-y-3 border-t pt-3">
            <Button type="button" onClick={() => setApproveOpen(true)} disabled={approve.isPending}>Validar depósito y activar acceso</Button>
            <div className="space-y-2"><Label htmlFor="deposit-rejection">Motivo si el depósito no es válido</Label><Textarea id="deposit-rejection" maxLength={1000} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={2} /></div>
            <Button type="button" variant="destructive" onClick={() => reject.mutate(current.id)} disabled={!rejectReason.trim() || reject.isPending}>Rechazar depósito</Button>
          </div>}
        </section>
      )}

      {detail.data?.moduleRequest && !detail.data.paymentRequest && (
                <section className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/30 p-4 text-sm">
                  <h3 className="font-semibold">Solicitud de módulo</h3>
                  <p>{MODULE_LABELS[detail.data.moduleRequest.key] ?? detail.data.moduleRequest.key}</p>
                  {detail.data.moduleRequest.enabled ? (
                    <p className="flex items-center gap-2 text-success"><CheckCircle2 className="h-4 w-4" /> Ya está habilitado para esta empresa.</p>
                  ) : <p className="text-muted-foreground">La empresa aún no adjunta comprobante de depósito. Puede hacerlo desde este ticket en su portal.</p>}
                </section>
              )}

              {detail.data?.environmentRequest && (
                <section className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/30 p-4 text-sm">
                  <h3 className="font-semibold">Cambio de ambiente DGII</h3>
                  <p><strong>Activo:</strong> {environmentLabel(detail.data.environmentRequest.activeEnvironment)}</p>
                  <p><strong>Solicitado:</strong> {environmentLabel(detail.data.environmentRequest.environment)}</p>
                  <p><strong>RNC:</strong> {detail.data.environmentRequest.rnc}</p>
                  {detail.data.environmentRequest.pending && canValidate && (
                    <div className="space-y-3 border-t pt-3">
                      {detail.data.environmentRequest.environment !== 'TesteCF' && (
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-1" checked={environmentConfirmed}
                            onChange={(event) => setEnvironmentConfirmed(event.target.checked)} />
                          Confirmo que la empresa está habilitada por la DGII para este ambiente.
                        </label>
                      )}
                      <Button type="button" disabled={approveEnvironment.isPending ||
                        (detail.data.environmentRequest.environment !== 'TesteCF' && !environmentConfirmed)}
                        onClick={() => approveEnvironment.mutate(current.id)}>
                        {approveEnvironment.isPending && <Loader2 className="animate-spin" />}
                        Aprobar y activar ambiente
                      </Button>
                    </div>
                  )}
                  {detail.data.environmentRequest.pending && !canValidate &&
                    <p className="text-muted-foreground">Solo el superadministrador puede aprobar este cambio.</p>}
                  {!detail.data.environmentRequest.pending &&
                    <p className="text-success">Solicitud cerrada.</p>}
                </section>
              )}

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
                {detail.data?.moduleRequest && (
                  <p className="text-xs text-muted-foreground">Cambiar el estado del ticket no habilita el módulo. Primero debe validarse el comprobante del depósito.</p>
                )}
                {detail.data?.environmentRequest?.pending && (
                  <p className="text-xs text-muted-foreground">Cerrar el ticket no activa el ambiente. Usa «Aprobar y activar ambiente» después de verificar la habilitación ante la DGII.</p>
                )}
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
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={(open) => !approve.isPending && setApproveOpen(open)}
        title="Validar depósito y activar acceso"
        description={`Confirma que el depósito coincide con el comprobante. Se activará ${detail.data?.paymentRequest?.kind === 'PLAN' ? `el plan ${detail.data.paymentRequest.planName}` : 'el módulo solicitado'} para ${current?.company ?? 'la empresa'}. El ticket quedará resuelto y la empresa recibirá una notificación.`}
        confirmLabel="Validar y activar"
        loading={approve.isPending}
        onConfirm={() => current && approve.mutate(current.id)}
      />
    </Sheet>
  );
}
