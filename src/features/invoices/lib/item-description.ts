export interface ItemDescriptionFields {
  descripcionItem?: string | null;
  fechaServicio?: string | null;
  chofer?: string | null;
  tms?: string | null;
  numeroSalida?: string | null;
  placa?: string | null;
}

export const ITEM_NAME_MAX_LENGTH = 80;
export const ITEM_DESCRIPTION_MAX_LENGTH = 1000;

export function isServiceDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Vista del detalle que la API resuelve para DescripcionItem; no modifica NombreItem. */
export function buildItemDescription(item: ItemDescriptionFields): string {
  const date = item.fechaServicio?.trim();
  const formattedDate = date && isServiceDate(date) ? date.split('-').reverse().join('/') : date;
  const segment = (label: string, value?: string | null) => value?.trim() ? `${label}: ${value.trim()}` : undefined;
  return [
    item.descripcionItem?.trim(),
    formattedDate,
    segment('Chofer', item.chofer),
    segment('TMS', item.tms),
    segment('Salida', item.numeroSalida),
    segment('Placa', item.placa),
  ].filter(Boolean).join(' | ');
}
