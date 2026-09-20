import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

export const salesReportQuerySchema = z
  .object({
    from: dateOnly,
    to: dateOnly,
    format: z.enum(["json", "pdf"]).optional().default("json"),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: "'from' no puede ser posterior a 'to'.",
    path: ["to"],
  });