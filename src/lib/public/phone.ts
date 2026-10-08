import { z } from "zod";

export const PHONE_ERROR = "Ingresa un número de celular válido de 8 dígitos.";
// Separators are accepted on paste; letters are rejected by server validation.
export const boliviaPhoneSchema = z.string().trim().transform(value => value.replace(/[\s-]/g, "")).pipe(z.string().regex(/^\d{8}$/, PHONE_ERROR));
export function phoneInput(value: string) { const digits = value.replace(/\D/g, ""); return (/^591\d{8}$/.test(digits) ? digits.slice(3) : digits).slice(0, 8); }
export function internationalBoliviaPhone(value: string) {
  const digits = value.replace(/[\s+-]/g, "");
  return /^\d{8}$/.test(digits) ? `591${digits}` : /^591\d{8}$/.test(digits) ? digits : null;
}
