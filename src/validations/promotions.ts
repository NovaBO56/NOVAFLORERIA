import { z } from "zod";

export const createPromotionSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(150),
  description: z.string().trim().max(500).optional().nullable(),
  promotion_type: z.enum(["cumpleanos", "recurrente", "temporada", "combo", "descuento"], {
    message: "Tipo de promoción no válido.",
  }),
  discount_type: z.enum(["porcentaje", "monto_fijo"], { message: "Tipo de descuento no válido." }),
  discount_value: z.coerce.number().min(0, "El valor del descuento no puede ser negativo."),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  minimum_purchase: z.coerce.number().min(0).optional().nullable(),
});

export const updatePromotionSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().max(500).nullable(),
    discount_type: z.enum(["porcentaje", "monto_fijo"]),
    discount_value: z.coerce.number().min(0),
    starts_at: z.string().nullable(),
    ends_at: z.string().nullable(),
    minimum_purchase: z.coerce.number().min(0).nullable(),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No hay cambios para actualizar." });

export const addPromotionProductSchema = z.object({
  product_id: z.string().uuid("El producto no es válido."),
});

export const addPromotionCustomerSchema = z.object({
  customer_id: z.string().uuid("El cliente no es válido."),
});

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().max(30).nullable(),
    whatsapp: z.string().trim().max(30).nullable(),
    email: z.string().trim().email("Correo no válido.").nullable(),
    birthday: z.string().nullable(),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No hay cambios para actualizar." });