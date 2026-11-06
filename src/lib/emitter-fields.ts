import { z } from 'zod';

const optionalLimitedText = (name: string, max: number) => z.string()
  .max(max, `${name} admite hasta ${max} caracteres. Reduce el valor para guardarlo.`)
  .nullish().transform((value) => value?.trim() ?? '');

function isValidEmitterEmail(value: string): boolean {
  if (!value) return true;
  if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)) return false;
  const [localPart, domain] = value.split('@');
  return localPart.length <= 64 && domain.split('.').every((label) =>
    label.length <= 63 && !label.startsWith('-') && !label.endsWith('-'));
}

/** Datos opcionales del emisor que se guardan en la empresa y se reutilizan al facturar. */
export const emitterFields = {
  sucursal: optionalLimitedText('Sucursal', 20),
  webSite: optionalLimitedText('WebSite', 50),
  email: optionalLimitedText('CorreoEmisor', 80).refine(
    isValidEmitterEmail,
    'Correo electrónico del emisor no válido.',
  ),
};
