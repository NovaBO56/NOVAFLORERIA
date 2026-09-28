import { z } from "zod";

// El orden final es el orden del array: la primera imagen queda con
// sort_order = 0 y por lo tanto es la "principal" (no existe una
// columna is_primary en product_images; sort_order ya resuelve esto).
export const reorderImagesSchema = z.object({
  image_ids: z.array(z.string().uuid("Uno de los ids de imagen no es válido.")).min(1, "Debes enviar al menos una imagen."),
});