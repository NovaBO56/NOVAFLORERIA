import { z } from "zod";

/* ============================================================
   LÍMITES DE LA BASE DE DATOS
   ============================================================
   numeric(12,2) -> máximo 9.999.999.999,99 con 2 decimales
   numeric(12,3) -> cantidades con 3 decimales
   ============================================================ */

const MAX_MONEY = 9_999_999_999;
const MAX_QUANTITY = 999_999;

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * "" / "  " -> null.  Los demás strings se convierten a número.
 * Evita el comportamiento de z.coerce.number(), que convierte
 * null y "" en 0 y dejaba pasar valores vacíos como "0".
 */
function toNumberOrNull(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : Number(trimmed);
  }

  return value;
}

/** Igual que toNumberOrNull, pero null también cuenta como "falta". */
function toNumberOrUndefined(value: unknown): unknown {
  const result = toNumberOrNull(value);

  return result === null ? undefined : result;
}

function hasMaxDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;

  return Math.abs(value * factor - Math.round(value * factor)) < 1e-6;
}

/** Monto obligatorio y mayor que cero (máx. 2 decimales). */
function requiredPositiveMoney(requiredMessage: string) {
  return z.preprocess(
    toNumberOrUndefined,
    z
      .number({ error: requiredMessage })
      .positive("El valor debe ser mayor que cero.")
      .max(MAX_MONEY, "El valor es demasiado grande.")
      .refine((value) => hasMaxDecimals(value, 2), {
        message: "Usa como máximo 2 decimales.",
      }),
  );
}

/** Monto opcional (puede ser null para "sin valor"), mayor que cero. */
const optionalPositiveMoney = z.preprocess(
  toNumberOrNull,
  z
    .number({ error: "El valor no es válido." })
    .positive("El valor debe ser mayor que cero.")
    .max(MAX_MONEY, "El valor es demasiado grande.")
    .refine((value) => hasMaxDecimals(value, 2), {
      message: "Usa como máximo 2 decimales.",
    })
    .nullable()
    .optional(),
);

/** Compra mínima: opcional, 0 permitido. */
const optionalMinimumPurchase = z.preprocess(
  toNumberOrNull,
  z
    .number({ error: "La compra mínima no es válida." })
    .min(0, "La compra mínima no puede ser negativa.")
    .max(MAX_MONEY, "La compra mínima es demasiado grande.")
    .refine((value) => hasMaxDecimals(value, 2), {
      message: "Usa como máximo 2 decimales.",
    })
    .nullable()
    .optional(),
);

/**
 * Fecha opcional. Acepta cualquier string que Date entienda y la
 * normaliza a ISO. "" -> null (sin límite).
 */
const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "La fecha no es válida.",
    })
    .transform((value) => new Date(value).toISOString())
    .nullable()
    .optional(),
);

type WithDates = {
  starts_at?: string | null;
  ends_at?: string | null;
};

function datesAreOrdered(data: WithDates) {
  if (!data.starts_at || !data.ends_at) return true;

  return Date.parse(data.ends_at) > Date.parse(data.starts_at);
}

const DATES_MESSAGE =
  "La fecha de finalización debe ser posterior a la de inicio.";

const PERCENT_MESSAGE =
  "El porcentaje de descuento no puede superar el 100%.";

/* ============================================================
   CREAR PROMOCIÓN
   ============================================================
   Promoción de producto: discount_type + discount_value.
   Promoción combo: combo_price (precio final del combo).
   Nunca se utilizan ambos conceptos al mismo tiempo.
   ============================================================ */

const basePromotionFields = {
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(150, "El nombre es demasiado largo."),

  description: z
    .string()
    .trim()
    .max(500, "La descripción es demasiado larga.")
    .optional()
    .nullable(),

  starts_at: optionalDate,

  ends_at: optionalDate,

  minimum_purchase: optionalMinimumPurchase,
};

const productPromotionSchema = z
  .object({
    promotion_type: z.literal("producto"),

    discount_type: z.enum(["porcentaje", "monto_fijo"], {
      error: "Tipo de descuento no válido.",
    }),

    discount_value: requiredPositiveMoney(
      "El valor del descuento es obligatorio.",
    ),

    ...basePromotionFields,
  })
  .refine(
    (data) =>
      data.discount_type !== "porcentaje" || data.discount_value <= 100,
    { message: PERCENT_MESSAGE, path: ["discount_value"] },
  );

const comboPromotionSchema = z.object({
  promotion_type: z.literal("combo"),

  combo_price: requiredPositiveMoney("El precio del combo es obligatorio."),

  ...basePromotionFields,
});

export const createPromotionSchema = z
  .discriminatedUnion("promotion_type", [
    productPromotionSchema,
    comboPromotionSchema,
  ])
  .refine(datesAreOrdered, { message: DATES_MESSAGE, path: ["ends_at"] });

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

/* ============================================================
   CLIENTES
   ============================================================ */

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(200),

  phone: z
    .string()
    .trim()
    .max(30)
    .nullable()
    .optional(),

  whatsapp: z
    .string()
    .trim()
    .max(30)
    .nullable()
    .optional(),

  email: z
    .string()
    .trim()
    .email("Correo no válido.")
    .nullable()
    .optional(),

  birthday: z
    .string()
    .nullable()
    .optional(),

  is_active: z.boolean().default(true),
});

/* ============================================================
   ACTUALIZAR PROMOCIÓN
   ============================================================
   promotion_type NO se actualiza: el tipo es permanente.

   La ruta PATCH debe comprobar si la promoción existente es
   "producto" o "combo" y permitir únicamente los campos que le
   corresponden. Además debe validar las fechas contra las ya
   guardadas cuando solo llega una de las dos.
   ============================================================ */

export const updatePromotionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(150, "El nombre es demasiado largo.")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "La descripción es demasiado larga.")
      .nullable()
      .optional(),

    discount_type: z
      .enum(["porcentaje", "monto_fijo"], {
        error: "Tipo de descuento no válido.",
      })
      .nullable()
      .optional(),

    discount_value: optionalPositiveMoney,

    combo_price: optionalPositiveMoney,

    starts_at: optionalDate,

    ends_at: optionalDate,

    minimum_purchase: optionalMinimumPurchase,

    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay cambios para actualizar.",
  })
  .refine(datesAreOrdered, { message: DATES_MESSAGE, path: ["ends_at"] })
  .refine(
    (data) =>
      !(
        data.discount_type === "porcentaje" &&
        typeof data.discount_value === "number" &&
        data.discount_value > 100
      ),
    { message: PERCENT_MESSAGE, path: ["discount_value"] },
  );

export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

/* ============================================================
   PRODUCTOS DE PROMOCIÓN
   ============================================================
   quantity:
   - Producto: cantidad asociada a la promoción.
   - Combo: cantidad requerida para formar una unidad del combo.
   numeric(12,3): máximo 3 decimales.
   ============================================================ */

const promotionQuantity = z.coerce
  .number({ error: "La cantidad no es válida." })
  .positive("La cantidad debe ser mayor que cero.")
  .max(MAX_QUANTITY, "La cantidad es demasiado grande.")
  .refine((value) => hasMaxDecimals(value, 3), {
    message: "Usa como máximo 3 decimales.",
  });

export const addPromotionProductSchema = z.object({
  product_id: z.string().uuid("El producto no es válido."),

  quantity: promotionQuantity.default(1),
});

export const updatePromotionProductSchema = z.object({
  quantity: promotionQuantity,
});

/* ============================================================
   ACTUALIZAR CLIENTE
   ============================================================ */

export const updateCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(200),

    phone: z
      .string()
      .trim()
      .max(30)
      .nullable(),

    whatsapp: z
      .string()
      .trim()
      .max(30)
      .nullable(),

    email: z
      .string()
      .trim()
      .email("Correo no válido.")
      .nullable(),

    birthday: z
      .string()
      .nullable(),

    is_active: z.boolean(),
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "No hay cambios para actualizar.",
    },
  );