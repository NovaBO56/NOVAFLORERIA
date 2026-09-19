import { z } from "zod";

export const createSaleReturnSchema = z.object({
  type: z.enum(["devolucion", "reintegro"], { message: "Tipo de devolución no válido." }),
  amount: z.coerce.number().positive("El monto debe ser mayor que cero."),
  reason: z.string().trim().min(1, "El motivo es obligatorio.").max(500),
});

export const requestOrderDeletionSchema = z.object({
  reason: z.string().trim().min(1, "El motivo es obligatorio.").max(500),
});

export const reviewDeletionRequestSchema = z.object({
  approve: z.boolean(),
  review_reason: z.string().trim().min(1, "El motivo de la revisión es obligatorio.").max(500),
});