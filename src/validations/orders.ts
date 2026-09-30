import { z } from "zod";

const orderItemSchema = z.object({
  product_id: z.string().uuid("El producto no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
  // Ids reales de customization_options elegidas para este producto.
  // El servidor valida que existan, estén activas y pertenezcan al
  // producto, y suma su extra_price real — nunca se confía en un
  // precio mandado por el cliente.
  customization_option_ids: z
    .array(z.string().uuid("Una opción de personalización no es válida."))
    .optional()
    .default([]),
  message: z.string().trim().max(500).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const createOrderSchema = z.object({
  customer_name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  customer_phone: z.string().trim().min(6, "El teléfono no es válido.").max(30),
  customer_whatsapp: z.string().trim().max(30).optional().nullable(),
  items: z.array(orderItemSchema).min(1, "El pedido debe tener al menos un producto."),
  customer_message: z.string().trim().max(1000).optional().nullable(),
  idempotency_key: z.string().trim().min(1, "Falta la clave de idempotencia.").max(100),
  promotion_id: z.string().uuid("La promoción no es válida.").optional().nullable(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1, "El motivo de cancelación es obligatorio.").max(500),
});