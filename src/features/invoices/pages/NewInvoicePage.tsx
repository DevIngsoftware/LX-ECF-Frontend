import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFieldArray, useForm, FormProvider, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, FileCheck2, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/animations/motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState, LoadingState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ECF_TYPE_MAP, INCOME_TYPES, ITBIS_RATES, MODIFICATION_CODES, PAYMENT_TYPES } from '@/constants/ecf';
import { ENV } from '@/constants/env';
import { ROUTES } from '@/constants/routes';
import { DgiiMessages } from '../components/DgiiMessages';
import { TotalsList } from '../components/TotalsList';
import { PartyPicker } from '../components/new/PartyPicker';
import { ProductPicker } from '../components/new/ProductPicker';
import { TypeSection } from '../components/new/TypeSection';
import { Field, FormSection } from '../components/new/form-ui';
import { defaultValues, emptyItem, fromDraft, invoiceFormSchema, isEcfCode, toDraft, type InvoiceFormValues } from '../components/new/schema';
import { computeTotals } from '../lib/invoice-math';
import { invoicesService } from '@/services/api/invoices';
import { partiesService } from '@/services/api/operations';
import { queryKeys } from '@/services/api/query-keys';
import { errorMessage } from '@/services/http/errors';
import { useAuth } from '@/features/auth/auth-context';
import type { PreValidationResult } from '@/types/ecf';

const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const pendingKey = 'lx-ecf-pending-invoice';

function savedPendingRequest(): { payload: string; key: string } | null {
  try {
    const raw = sessionStorage.getItem(pendingKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { payload?: unknown; key?: unknown };
    return typeof parsed.payload === 'string' && typeof parsed.key === 'string'
      ? { payload: parsed.payload, key: parsed.key } : null;
  } catch { return null; }
}

function firstValidationMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if ('message' in value && typeof value.message === 'string') return value.message;
  for (const nested of Object.values(value)) {
    const message = firstValidationMessage(nested);
    if (message) return message;
  }
  return undefined;
}

export function NewInvoicePage() {
  const { hasModule } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const requestedType = params.get('tipo');
  const refId = params.get('ref');
  const draftId = params.get('borrador');
  const noteType = requestedType === 'E33' || requestedType === 'E34' ? requestedType : null;
  const [validation, setValidation] = useState<PreValidationResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const pendingRequest = useRef<{ payload: string; key: string } | null>(savedPendingRequest());
  const restoredDraftId = useRef<string | null>(null);
  const form = useForm<InvoiceFormValues>({ resolver: zodResolver(invoiceFormSchema), defaultValues: defaultValues(isEcfCode(requestedType) ? requestedType : 'E31') });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const type = useWatch({ control: form.control, name: 'type' });
  const paymentType = useWatch({ control: form.control, name: 'paymentType' });
  const items = useWatch({ control: form.control, name: 'items' });
  const retentions = useWatch({ control: form.control, name: 'retentions' });
  const config = ECF_TYPE_MAP[type];
  const totals = useMemo(() => computeTotals(items ?? [], retentions), [items, retentions]);
  const reference = useQuery({ queryKey: queryKeys.invoice(refId ?? ''), queryFn: () => invoicesService.get(refId!), enabled: !!refId && !!noteType && !draftId });
  const savedDraft = useQuery({ queryKey: ['invoice-draft', draftId], queryFn: () => invoicesService.getDraft(draftId!), enabled: !!draftId && !ENV.invoicesUseMocks });
  const customerId = (location.state as { customerId?: string } | null)?.customerId;
  const savedCustomer = useQuery({ queryKey: queryKeys.party('customers', customerId ?? ''),
    queryFn: () => partiesService.get('customers', customerId!), enabled: !!customerId && !noteType && !draftId });

  useEffect(() => {
    if (!draftId) { restoredDraftId.current = null; return; }
    if (savedDraft.data && restoredDraftId.current !== draftId) {
      form.reset(fromDraft(savedDraft.data));
      restoredDraftId.current = draftId;
    }
  }, [draftId, form, savedDraft.data]);

  useEffect(() => {
    if (!savedCustomer.data || noteType || draftId) return;
    form.setValue('buyer.partyId', savedCustomer.data.id);
    form.setValue('buyer.rnc', savedCustomer.data.rnc);
    form.setValue('buyer.name', savedCustomer.data.legalName);
    form.setValue('buyer.email', savedCustomer.data.email ?? '');
  }, [form, noteType, draftId, savedCustomer.data]);

  useEffect(() => {
    if (type !== 'E44' && type !== 'E46' && type !== 'E47') return;
    form.getValues('items').forEach((item, index) => {
      if (item.itbisRate !== 0) form.setValue(`items.${index}.itbisRate`, 0);
    });
  }, [type, form]);

  useEffect(() => {
    if (!reference.data || !noteType || draftId) return;
    form.setValue('type', noteType);
    form.setValue('buyer.name', reference.data.buyer.name ?? reference.data.buyerName);
    form.setValue('buyer.rnc', reference.data.buyer.rnc ?? reference.data.buyerRnc ?? '');
    form.setValue('buyer.email', reference.data.buyer.email ?? '');
    form.setValue('reference.modifiedNcf', reference.data.encf);
    form.setValue('reference.modifiedDate', reference.data.issueDate.slice(0, 10));
  }, [form, noteType, draftId, reference.data]);

  const validate = useMutation({
    mutationFn: (values: InvoiceFormValues) => invoicesService.validate(toDraft(values)),
    onSuccess: (result) => { setValidation(result); toast[result.valid ? 'success' : 'error'](result.valid ? 'Borrador validado' : 'Revisa los mensajes de validación'); },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const save = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const payload = toDraft(values);
      if (draftId) {
        await invoicesService.updateDraft(draftId, payload);
        return { id: draftId };
      }
      return invoicesService.saveDraft(payload);
    },
    onSuccess: ({ id }) => {
      void qc.invalidateQueries({ queryKey: ['invoice-drafts'] });
      toast.success('Borrador guardado');
      if (!draftId) {
        const next = new URLSearchParams(params);
        next.set('borrador', id);
        navigate(`${ROUTES.app.newInvoice}?${next}`, { replace: true });
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const emit = useMutation({
    mutationFn: (values: InvoiceFormValues) => {
      const draft = toDraft(values);
      const payload = JSON.stringify(draft);
      if (pendingRequest.current?.payload !== payload) {
        pendingRequest.current = { payload, key: crypto.randomUUID() };
        try { sessionStorage.setItem(pendingKey, JSON.stringify(pendingRequest.current)); } catch { /* memoria disponible */ }
      }
      return invoicesService.emit(draft, pendingRequest.current.key);
    },
    onSuccess: (result) => {
      pendingRequest.current = null;
      try { sessionStorage.removeItem(pendingKey); } catch { /* memoria disponible */ }
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      if (draftId) {
        void invoicesService.deleteDraft(draftId).then(() => qc.invalidateQueries({ queryKey: ['invoice-drafts'] }))
          .catch(() => toast.error('El comprobante se registró, pero no se pudo retirar el borrador. Puedes eliminarlo desde Comprobantes.'));
      }
      toast.success(ENV.invoicesUseMocks ? 'Comprobante creado en modo demostración' : 'Comprobante registrado');
      navigate(ROUTES.app.invoice(result.id));
    },
    onError: (error) => {
      const message = `No se pudo registrar el comprobante: ${errorMessage(error)}`;
      setFormError(message);
      toast.error(message);
    },
  });
  const busy = validate.isPending || emit.isPending || save.isPending;
  const errors = form.formState.errors;
  const onInvalid = (invalid: FieldErrors<InvoiceFormValues>) => {
    const message = firstValidationMessage(invalid) ?? 'Revisa los datos del comprobante';
    const feedback = `No se registró el comprobante: ${message}. Corrige el campo señalado en el formulario y vuelve a intentarlo.`;
    setFormError(feedback);
    toast.error(`No se registró el comprobante: ${message}`);
  };
  const validateForm = form.handleSubmit((values) => {
    setFormError(null);
    validate.mutate(values);
  }, onInvalid);
  const registerForm = form.handleSubmit((values) => {
    setFormError(null);
    emit.mutate(values);
  }, onInvalid);

  return <PageTransition>
    <PageHeader eyebrow="Facturación electrónica" title={type === 'E33' || type === 'E34' ? 'Nueva nota electrónica' : 'Nueva factura'} description={ENV.invoicesUseMocks ? 'Prepara un e-CF y revisa los totales antes de registrarlo. En modo demostración no se envía a la DGII.' : 'Prepara el e-CF, valídalo y regístralo. Podrás enviarlo a la DGII desde el detalle.'}
      actions={<Button asChild variant="outline"><Link to={ROUTES.app.invoices}><ArrowLeft /> Comprobantes</Link></Button>} />
    {reference.error && <div className="mb-6"><ErrorState compact error={reference.error} onRetry={() => void reference.refetch()} /></div>}
    {savedDraft.isLoading && <LoadingState rows={5} />}
    {savedDraft.error && <ErrorState error={savedDraft.error} onRetry={() => void savedDraft.refetch()} />}
    {!savedDraft.isLoading && !savedDraft.error && (
    <FormProvider {...form}>
      <form onSubmit={registerForm} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <TypeSection step={1} locked={!!noteType && !!reference.data} />
          <FormSection id="sec-comprador" step={2} title={config.buyerLabel} description="Elige un cliente guardado o escribe sus datos directamente.">
            {config.buyerMode === 'none' ? <p className="text-sm text-muted-foreground">Este tipo de e-CF no requiere datos de receptor.</p> : <div className="space-y-4">
              {config.buyerMode !== 'foreign' && (ENV.invoicesUseMocks || config.buyerMode !== 'supplier') && <PartyPicker kind={config.buyerMode === 'supplier' ? 'suppliers' : 'customers'} label="Elegir cliente guardado" onSelect={(party) => {
                form.setValue('buyer.partyId', party.id);
                form.setValue('buyer.rnc', party.rnc);
                form.setValue('buyer.name', party.legalName);
                form.setValue('buyer.email', party.email ?? '');
              }} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="buyer-name" label="Nombre o razón social" error={errors.buyer?.name?.message}><Input id="buyer-name" {...form.register('buyer.name')} /></Field>
                {config.buyerMode === 'foreign' ? <>
                  <Field id="buyer-country" label="País" error={errors.buyer?.country?.message}><Input id="buyer-country" {...form.register('buyer.country')} /></Field>
                  <Field id="buyer-foreign-id" label="Identificación extranjera" error={errors.buyer?.foreignId?.message}><Input id="buyer-foreign-id" {...form.register('buyer.foreignId')} /></Field>
                </> : <Field id="buyer-rnc" label="RNC o cédula" error={errors.buyer?.rnc?.message}><Input id="buyer-rnc" inputMode="numeric" {...form.register('buyer.rnc')} /></Field>}
                <Field id="buyer-email" label="Correo electrónico" error={errors.buyer?.email?.message}><Input id="buyer-email" type="email" {...form.register('buyer.email')} /></Field>
              </div>
            </div>}
          </FormSection>
          <FormSection id="sec-articulos" step={3} title="Artículos y servicios" description="Agrega los conceptos del comprobante." aside={<Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem(), itbisRate: type === 'E44' || type === 'E46' || type === 'E47' ? 0 : 18 })}><Plus /> Agregar línea</Button>}>
            <div className="space-y-4">{fields.map((field, index) => <div key={field.id} className="rounded-xl border bg-background/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Línea {index + 1}</h3><div className="flex items-center gap-2">
                {hasModule('catalog') && <ProductPicker onSelect={(product) => {
                  form.setValue(`items.${index}.code`, product.code);
                  form.setValue(`items.${index}.description`, product.name);
                  form.setValue(`items.${index}.kind`, product.kind);
                  form.setValue(`items.${index}.unitPrice`, product.price);
                  form.setValue(`items.${index}.itbisRate`, type === 'E44' || type === 'E46' || type === 'E47' ? 0 : product.itbisRate);
                }} />}
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Eliminar línea ${index + 1}`} disabled={fields.length === 1} onClick={() => remove(index)}><Trash2 /></Button>
              </div></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field id={`description-${index}`} label="Descripción" error={errors.items?.[index]?.description?.message} className="sm:col-span-2 xl:col-span-3"><Input id={`description-${index}`} {...form.register(`items.${index}.description`)} /></Field>
                <Field id={`kind-${index}`} label="Tipo"><select id={`kind-${index}`} className={selectClass} {...form.register(`items.${index}.kind`)}><option value="SERVICIO">Servicio</option><option value="BIEN">Bien</option></select></Field>
                <Field id={`quantity-${index}`} label="Cantidad" error={errors.items?.[index]?.quantity?.message}><Input id={`quantity-${index}`} type="number" min="0.01" step="0.01" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></Field>
                <Field id={`price-${index}`} label="Precio unitario" error={errors.items?.[index]?.unitPrice?.message}><Input id={`price-${index}`} type="number" min="0" step="0.01" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></Field>
                <Field id={`discount-${index}`} label="Descuento" error={errors.items?.[index]?.discount?.message}><Input id={`discount-${index}`} type="number" min="0" step="0.01" {...form.register(`items.${index}.discount`, { valueAsNumber: true })} /></Field>
                <Field id={`itbis-${index}`} label="ITBIS"><select id={`itbis-${index}`} className={selectClass} {...form.register(`items.${index}.itbisRate`, { valueAsNumber: true })}>{ITBIS_RATES.filter((rate) => type !== 'E44' && type !== 'E46' && type !== 'E47' || rate.value === 0).map((rate) => <option key={rate.value} value={rate.value}>{rate.label}</option>)}</select></Field>
              </div>
            </div>)}</div>
          </FormSection>
          <FormSection id="sec-pago" step={4} title="Pago y detalles">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="income-type" label="Tipo de ingreso" error={errors.incomeType?.message}><select id="income-type" className={selectClass} {...form.register('incomeType')}>{INCOME_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <Field id="payment-type" label="Forma de pago" error={errors.paymentType?.message}><select id="payment-type" className={selectClass} {...form.register('paymentType')}>{PAYMENT_TYPES.filter((item) => item.value !== '2' || config.allowsCredit).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              {paymentType === '2' && <Field id="payment-days" label="Plazo en días" error={errors.paymentTermDays?.message}><Input id="payment-days" type="number" min="1" max="365" {...form.register('paymentTermDays', { setValueAs: (value) => value === '' ? undefined : Number(value) })} /></Field>}
              {config.allowsRetentions && <><Field id="retained-itbis" label="ITBIS retenido" error={errors.retentions?.itbis?.message}><Input id="retained-itbis" type="number" min="0" step="0.01" {...form.register('retentions.itbis', { valueAsNumber: true })} /></Field><Field id="retained-isr" label="ISR retenido" error={errors.retentions?.isr?.message}><Input id="retained-isr" type="number" min="0" step="0.01" {...form.register('retentions.isr', { valueAsNumber: true })} /></Field></>}
              <Field id="notes" label="Notas" className="sm:col-span-2" error={errors.notes?.message}><Textarea id="notes" rows={2} {...form.register('notes')} /></Field>
            </div>
          </FormSection>
          {config.requiresReference && <FormSection id="sec-referencia" step={5} title="Comprobante de referencia" description="Indica el comprobante que modifica esta nota.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="modified-ncf" label="e-NCF o NCF modificado" error={errors.reference?.modifiedNcf?.message}><Input id="modified-ncf" {...form.register('reference.modifiedNcf')} /></Field>
              <Field id="modified-date" label="Fecha del comprobante" error={errors.reference?.modifiedDate?.message}><Input id="modified-date" type="date" {...form.register('reference.modifiedDate')} /></Field>
              <Field id="modification-code" label="Motivo de modificación" error={errors.reference?.modificationCode?.message}><select id="modification-code" className={selectClass} {...form.register('reference.modificationCode')}><option value="">Selecciona</option>{MODIFICATION_CODES.map((code) => <option key={code.value} value={code.value}>{code.label}</option>)}</select></Field>
              <Field id="reason" label="Descripción del motivo" error={errors.reference?.reason?.message} className="sm:col-span-2"><Textarea id="reason" rows={2} {...form.register('reference.reason')} /></Field>
            </div>
          </FormSection>}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="surface space-y-5 p-5"><h2 className="font-semibold">Resumen</h2>
          <TotalsList values={{ subtotal: totals.taxable, discount: totals.discount, itbis: totals.itbis, itbisByRate: totals.itbisByRate, retainedItbis: totals.retainedItbis, retainedIsr: totals.retainedIsr, total: totals.total }} />
          <div className="space-y-2 border-t pt-5">{!ENV.invoicesUseMocks && <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => save.mutate(form.getValues())}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Guardar borrador</Button>}<Button type="button" variant="outline" className="w-full" disabled={busy} onClick={validateForm}>{validate.isPending ? <Loader2 className="animate-spin" /> : <FileCheck2 />} Validar borrador</Button><Button type="submit" className="w-full" disabled={busy}>{emit.isPending ? <Loader2 className="animate-spin" /> : <FileCheck2 />} Registrar comprobante</Button></div>
          {formError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{formError}</p>}
          <p className="text-xs text-muted-foreground">{ENV.invoicesUseMocks ? 'Modo demostración: el registro se guarda solo en la memoria de esta página y no tiene validez fiscal.' : 'Registrar asigna un e-NCF real de la empresa. El envío a la DGII es un paso separado.'}</p>
        </div>{validation && <div className="surface mt-4 p-4"><h2 className="mb-3 text-sm font-semibold">Validación</h2><DgiiMessages messages={validation.messages} tone={validation.valid ? 'info' : 'warning'} /></div>}</aside>
      </form>
    </FormProvider>
    )}
  </PageTransition>;
}
