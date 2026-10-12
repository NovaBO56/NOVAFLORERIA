import { z } from "zod";

// Verified against the active baseline: products.price numeric(12,2),
// order_items.quantity / inventory quantities numeric(12,3).
export const MAX_PRODUCT_PRICE = 9_999_999_999.99;
export const MAX_ORDER_QUANTITY = 999_999_999.999;

function hasPrecision(value: number, decimals: number) {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) <= Number.EPSILON * Math.max(1, Math.abs(scaled)) * 2;
}

export const productPriceSchema = z.coerce.number()
  .positive("El precio debe ser mayor a cero.")
  .max(MAX_PRODUCT_PRICE, "El precio excede el rango permitido.")
  .refine(value => hasPrecision(value, 2), "El precio admite como máximo dos decimales.");

export const orderQuantitySchema = z.coerce.number()
  .min(0.001, "La cantidad mínima es 0.001.")
  .max(MAX_ORDER_QUANTITY, "La cantidad excede el rango permitido.")
  .refine(value => hasPrecision(value, 3), "La cantidad admite como máximo tres decimales.");

export const uuidSchema = z.string().uuid();

// Calendar validation before Date.parse: it would normalize February 30.
export const receivedAtSchema = z.string().refine(value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match) return false;
  if (value.includes("T")) {
    const time = value.slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!time || Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3] ?? 0) > 59) return false;
  }
  const [, year, month, day] = match.map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1] && Number.isFinite(Date.parse(value));
}, "La fecha de entrada no es válida.");
