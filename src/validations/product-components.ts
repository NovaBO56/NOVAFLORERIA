import { z } from "zod";

export const addComponentSchema = z.object({
  component_product_id: z.string().uuid("El producto componente no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
});