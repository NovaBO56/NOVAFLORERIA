import { z } from "zod";

export const updateImageSchema = z.object({
  alt_text: z.string().trim().max(300, "El texto alternativo es demasiado largo.").nullable(),
});