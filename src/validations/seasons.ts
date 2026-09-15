import { z } from "zod";

const dateOrder = (data: { starts_at?: string | null; ends_at?: string | null }) =>
  !data.starts_at || !data.ends_at || new Date(data.starts_at) < new Date(data.ends_at);

export const createSeasonSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre de la temporada es obligatorio.").max(120),
    description: z.string().trim().max(500).optional().nullable(),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
  })
  .refine(dateOrder, {
    message: "La fecha de inicio debe ser anterior a la fecha de finalización.",
    path: ["ends_at"],
  });

export const updateSeasonSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable(),
    starts_at: z.string().nullable(),
    ends_at: z.string().nullable(),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay cambios para actualizar.",
  })
  .refine(dateOrder, {
    message: "La fecha de inicio debe ser anterior a la fecha de finalización.",
    path: ["ends_at"],
  });