import { z } from "zod";

const saleItemSchema = z.object({
  product_id: z.string().uuid("El producto no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
});

export const createPhysicalSaleSchema = z
  .object({
    items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto."),
    customer_id: z.string().uuid().optional().nullable(),
    promotion_id: z.string().uuid().optional().nullable(),
    manual_discount_amount: z.coerce.number().positive().optional().nullable(),
    manual_discount_reason: z.string().trim().max(500).optional().nullable(),
    payment_method: z.enum(["qr", "efectivo"], { message: "Método de pago no válido." }),
  })
  .superRefine((data, ctx) => {
    if (data.promotion_id && data.manual_discount_amount) {
      ctx.addIssue({
        code: "custom",
        path: ["manual_discount_amount"],
        message: "No se puede usar una promoción y un descuento manual al mismo tiempo.",
      });
    }
    if (data.manual_discount_amount && (!data.manual_discount_reason || data.manual_discount_reason.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        path: ["manual_discount_reason"],
        message: "El motivo del descuento manual es obligatorio.",
      });
    }
  });

export const advanceOrderStatusSchema = z.object({
  new_status: z.enum(["en_preparacion", "listo", "finalizado"], {
    message: "Estado no válido.",
  }),
});