import { z } from "zod";

export const updateWhatsappConfigSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, "El número debe tener solo dígitos, sin espacios ni símbolos, en formato internacional (ej. 59170011223)."),
});