import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable(),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay cambios para actualizar.",
  });