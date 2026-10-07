import type {
  BusinessStatus,
  PublicImage,
  PublicPromotion,
  WeekDay,
} from "./types";

/* ============================================================
   Funciones puras de formato y reglas de la tienda pública.
   (Sin React ni Next: se pueden probar con Vitest.)
   ============================================================ */

export function formatMoney(value: number | string) {
  return `Bs ${Number(value).toFixed(2)}`;
}

/** "08:00:00" -> "08:00" */
export function formatTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

type WithImages = { images?: PublicImage[] | null };

/** Imagen principal (sort_order = 0) o la primera disponible. */
export function pickImage(product: WithImages): PublicImage | null {
  const images = product.images ?? [];

  return images.find((image) => image.sort_order === 0) ?? images[0] ?? null;
}

/** Se puede comprar solo si está disponible y no agotado. */
export function isPurchasable(product: {
  is_available: boolean;
  is_sold_out: boolean;
}) {
  return product.is_available && !product.is_sold_out;
}

export function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  return letters.join("") || "N";
}

/** Texto del beneficio de una promoción. */
export function promotionBenefit(promotion: PublicPromotion) {
  if (promotion.promotion_type === "combo") {
    return promotion.combo_price !== null
      ? `Combo a ${formatMoney(promotion.combo_price)}`
      : "Combo especial";
  }

  if (promotion.discount_type === "porcentaje") {
    return `${Number(promotion.discount_value)}% de descuento`;
  }

  return `${formatMoney(promotion.discount_value ?? 0)} de descuento`;
}

function formatDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/La_Paz",
  });
}

/** "Hasta 15/02/2026", "Desde 01/01/2027" o null si no tiene fechas. */
export function promotionValidity(promotion: PublicPromotion) {
  const start = promotion.starts_at ? formatDay(promotion.starts_at) : null;
  const end = promotion.ends_at ? formatDay(promotion.ends_at) : null;

  if (start && end) return `Del ${start} al ${end}`;
  if (end) return `Hasta el ${end}`;
  if (start) return `Desde el ${start}`;

  return null;
}

/**
 * ¿Se pueden tomar pedidos ahora? Si todavía no se conoce el horario
 * (null) no se bloquea nada: el servidor valida igual en create_order().
 */
export function acceptingOrders(status: BusinessStatus | null) {
  if (!status) return true;

  return status.is_open || status.accept_orders_outside_hours;
}

/** Horario de hoy para mostrar: "08:00 – 20:00" o "Cerrado". */
export function todayHoursLabel(status: BusinessStatus | null) {
  if (!status) return null;
  if (status.is_closed_today) return "Cerrado";

  const opens = formatTime(status.opens_at);
  const closes = formatTime(status.closes_at);

  return opens && closes ? `${opens} – ${closes}` : null;
}

export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

/** Semana ordenada de lunes a domingo (la base usa 0 = domingo). */
export function orderedWeek(week: WeekDay[]) {
  const order = [1, 2, 3, 4, 5, 6, 0];

  return order
    .map((day) => week.find((entry) => entry.day_of_week === day))
    .filter((entry): entry is WeekDay => Boolean(entry));
}

export function dayHoursLabel(day: WeekDay) {
  if (day.is_closed) return "Cerrado";

  const opens = formatTime(day.opens_at);
  const closes = formatTime(day.closes_at);

  return opens && closes ? `${opens} – ${closes}` : "Cerrado";
}

/** Enlace wa.me (el número se guarda solo con dígitos). */
export function whatsappLink(phone: string | null, message?: string) {
  if (!phone) return null;

  const base = `https://wa.me/${phone}`;

  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}