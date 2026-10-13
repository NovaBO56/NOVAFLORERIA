import { z } from "zod";

export const createSaleReturnSchema = z.object({
  type: z.enum(["devolucion", "reintegro", "retorno_fisico"], { message: "Tipo de devolución no válido." }),
  amount: z.coerce.number().finite().min(0).max(9999999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001, "Usa como máximo dos decimales."),
  reason: z.string().trim().min(1, "El motivo es obligatorio.").max(500),
  idempotency_key: z.string().uuid("La clave de reintento es obligatoria."),
}).refine(data => data.type === "retorno_fisico" ? data.amount === 0 : data.amount > 0, { message: "El monto no corresponde al tipo de operación.", path: ["amount"] });

export const requestOrderDeletionSchema = z.object({
  reason: z.string().trim().min(1, "El motivo es obligatorio.").max(500),
});

export const reviewDeletionRequestSchema = z.object({
  approve: z.boolean(),
  review_reason: z.string().trim().min(1, "El motivo de la revisión es obligatorio.").max(500),
});
