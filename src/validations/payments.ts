import { z } from "zod";

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1, "El motivo de rechazo es obligatorio.").max(500),
});

export const updatePaymentQrSchema = z.object({
  account_label: z.string().trim().max(200).optional().nullable(),
  qr_slot: z.enum(["qr_1", "qr_2"]).default("qr_1"),
  is_active: z.boolean().default(true),
});

export const patchPaymentQrSchema = z.object({
  qr_slot: z.enum(["qr_1", "qr_2"]).default("qr_1"),
  account_label: z.string().trim().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
}).refine(value => value.account_label !== undefined || value.is_active !== undefined, "No hay cambios para guardar.");

export const reportQrSelectionSchema = z.object({ qr_slot: z.enum(["qr_1", "qr_2"]).optional() });
