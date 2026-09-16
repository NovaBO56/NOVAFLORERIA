import { z } from "zod";

export const addRequirementSchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
});

export const updateRequirementSchema = z.object({
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
});

export const createCustomizationOptionSchema = z.object({
  option_type: z.enum(
    ["cantidad_rosas", "color", "tipo_flor", "oso", "decoracion", "otro"],
    { message: "Tipo de personalización no válido." },
  ),
  name: z.string().trim().min(1, "El nombre de la opción es obligatorio.").max(120),
  value: z.string().trim().max(200).optional().nullable(),
  extra_price: z.coerce.number().min(0, "El precio extra no puede ser negativo.").optional().default(0),
});

export const updateCustomizationOptionSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    value: z.string().trim().max(200).nullable(),
    extra_price: z.coerce.number().min(0),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay cambios para actualizar.",
  });