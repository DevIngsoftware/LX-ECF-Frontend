import { useFormContext, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { buildItemDescription, ITEM_DESCRIPTION_MAX_LENGTH } from '../../lib/item-description';
import { Field } from './form-ui';
import type { InvoiceFormValues } from './schema';

export function ItemDetailsFields({ index }: { index: number }) {
  const { control, register, formState: { errors } } = useFormContext<InvoiceFormValues>();
  const item = useWatch({ control, name: `items.${index}` });
  const description = buildItemDescription(item ?? {});
  const itemErrors = errors.items?.[index];

  return <div className="mt-4 space-y-4">
    <Field id={`item-details-${index}`} label="Descripción adicional (opcional)" error={itemErrors?.descripcionItem?.message}
      hint="Hasta 1000 caracteres, incluidos los datos del viaje. Usa este espacio para la información que acompaña al concepto principal.">
      <Textarea id={`item-details-${index}`} rows={2} aria-invalid={!!itemErrors?.descripcionItem}
        aria-describedby={itemErrors?.descripcionItem ? `item-details-${index}-error` : undefined}
        {...register(`items.${index}.descripcionItem`)} />
    </Field>
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">Datos del viaje (opcional)</summary>
      <p className="mt-2 text-xs text-muted-foreground">Se agregarán automáticamente a la descripción adicional. No necesitas repetirlos en el nombre ni en la descripción.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field id={`service-date-${index}`} label="Fecha del servicio" error={itemErrors?.fechaServicio?.message}>
          <Input id={`service-date-${index}`} type="date" aria-invalid={!!itemErrors?.fechaServicio} {...register(`items.${index}.fechaServicio`)} />
        </Field>
        <Field id={`driver-${index}`} label="Chofer" error={itemErrors?.chofer?.message}>
          <Input id={`driver-${index}`} {...register(`items.${index}.chofer`)} />
        </Field>
        <Field id={`tms-${index}`} label="TMS" error={itemErrors?.tms?.message}>
          <Input id={`tms-${index}`} {...register(`items.${index}.tms`)} />
        </Field>
        <Field id={`departure-${index}`} label="Número de salida" error={itemErrors?.numeroSalida?.message}>
          <Input id={`departure-${index}`} {...register(`items.${index}.numeroSalida`)} />
        </Field>
        <Field id={`plate-${index}`} label="Placa" error={itemErrors?.placa?.message}>
          <Input id={`plate-${index}`} {...register(`items.${index}.placa`)} />
        </Field>
      </div>
    </details>
    {description && <div className="rounded-lg bg-muted/50 p-3 text-xs">
      <p className="font-medium">Descripción adicional en la factura <span className={description.length > ITEM_DESCRIPTION_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}>({description.length}/{ITEM_DESCRIPTION_MAX_LENGTH})</span></p>
      <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{description}</p>
    </div>}
  </div>;
}
