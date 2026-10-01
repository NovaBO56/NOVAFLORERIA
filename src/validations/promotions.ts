import { z } from "zod";

const basePromotionFields = {
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(150),

  description: z.string().trim().max(500).optional().nullable(),

  starts_at: z.string().optional().nullable(),

  ends_at: z.string().optional().nullable(),

  minimum_purchase: z.coerce
    .number()
    .min(0)
    .optional()
    .nullable(),
};

/**
 * Promoción de producto:
 * utiliza discount_type + discount_value.
 *
 * Promoción combo:
 * utiliza combo_price como precio final del combo.
 *
 * Nunca se utilizan ambos conceptos al mismo tiempo.
 */
export const createPromotionSchema = z.discriminatedUnion(
  "promotion_type",
  [
    z.object({
      promotion_type: z.literal("producto"),

      discount_type: z.enum(
        ["porcentaje", "monto_fijo"],
        {
          message: "Tipo de descuento no válido.",
        },
      ),

      discount_value: z.coerce
        .number()
        .min(0, "El valor del descuento no puede ser negativo."),

      ...basePromotionFields,
    }),

    z.object({
      promotion_type: z.literal("combo"),

      combo_price: z.coerce
        .number()
        .min(0, "El precio del combo no puede ser negativo."),

      ...basePromotionFields,
    }),
  ],
);


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
   promotion_type NO se actualiza.
   El tipo de promoción es permanente.

   La ruta PATCH debe comprobar si la promoción existente
   es "producto" o "combo" y permitir únicamente los campos
   correspondientes.
   ============================================================ */

export const updatePromotionSchema = z
  .object({
    name: z.string().trim().min(1).max(150),

    description: z.string().trim().max(500).nullable(),

    discount_type: z
      .enum(["porcentaje", "monto_fijo"])
      .nullable(),

    discount_value: z
      .coerce
      .number()
      .min(0)
      .nullable(),

    combo_price: z
      .coerce
      .number()
      .min(0)
      .nullable(),

    starts_at: z.string().nullable(),

    ends_at: z.string().nullable(),

    minimum_purchase: z
      .coerce
      .number()
      .min(0)
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


/* ============================================================
   PRODUCTOS DE PROMOCIÓN
   ============================================================
   quantity:
   - Producto: cantidad asociada a la promoción.
   - Combo: cantidad requerida para formar una unidad del combo.
   ============================================================ */

export const addPromotionProductSchema = z.object({
  product_id: z.string().uuid(
    "El producto no es válido.",
  ),

  quantity: z.coerce
    .number()
    .positive(
      "La cantidad debe ser mayor que cero.",
    )
    .default(1),
});


export const updatePromotionProductSchema = z.object({
  quantity: z.coerce
    .number()
    .positive(
      "La cantidad debe ser mayor que cero.",
    ),
});


/* ============================================================
   CLIENTES
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