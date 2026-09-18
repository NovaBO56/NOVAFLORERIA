import { z } from "zod";

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1, "El motivo de rechazo es obligatorio.").max(500),
});

export const updatePaymentQrSchema = z.object({
  account_label: z.string().trim().max(200).optional().nullable(),
});