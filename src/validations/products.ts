import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre del producto es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0, "El precio debe ser un número mayor o igual a cero."),
  category_id: z.string().uuid().optional().nullable(),
  occasion: z.string().trim().max(120).optional().nullable(),
  season_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean().optional().default(false),
  is_available: z.boolean().optional().default(true),
  is_sold_out: z.boolean().optional().default(false),
  catalog_order: z.coerce
    .number()
    .int("El orden del catálogo debe ser un número entero mayor o igual a cero.")
    .min(0)
    .optional()
    .default(0),
  is_active: z.boolean().optional().default(true),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable(),
    price: z.coerce.number().min(0),
    category_id: z.string().uuid().nullable(),
    occasion: z.string().trim().max(120).nullable(),
    season_id: z.string().uuid().nullable(),
    is_featured: z.boolean(),
    is_available: z.boolean(),
    is_sold_out: z.boolean(),
    catalog_order: z.coerce.number().int().min(0),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay datos para actualizar.",
  });