import { z } from "zod";

export const listOrdersQuerySchema = z.object({
  status: z.enum(["activos", "todos", "expirados", "rechazado", "pendiente_pago", "confirmado", "en_preparacion", "listo", "finalizado", "cancelado"]).default("todos"),
  type: z.enum(["todos", "online", "fisica"]).default("todos"),
  pending_payment: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
  search: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
