import { z } from "zod";

export const updateBusinessHoursSchema = z
  .object({
    opens_at: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)."),
    closes_at: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)."),
    is_closed: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No hay cambios para actualizar." })
  .refine((data) => data.is_closed === true || !data.opens_at || !data.closes_at || data.opens_at < data.closes_at, {
    message: "La hora de apertura debe ser anterior a la de cierre.",
    path: ["closes_at"],
  });

export const updateAcceptOrdersOutsideHoursSchema = z.object({
  enabled: z.boolean(),
});