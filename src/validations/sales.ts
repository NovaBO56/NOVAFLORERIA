import { z } from "zod";

const saleItemSchema = z.object({
  product_id: z.string().uuid("El producto no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
});

export const createPhysicalSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto."),
  discount_total: z.coerce.number().min(0, "El descuento no puede ser negativo.").optional().default(0),
  payment_method: z.enum(["qr", "efectivo"], { message: "Método de pago no válido." }),
});

export const advanceOrderStatusSchema = z.object({
  new_status: z.enum(["en_preparacion", "listo", "finalizado"], {
    message: "Estado no válido.",
  }),
});