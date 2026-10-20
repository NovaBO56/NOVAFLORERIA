import { z } from "zod";

export const dedicationSchema = z.object({
  message: z.string().max(250, "La dedicatoria admite hasta 250 caracteres."),
  signature: z.string().max(60, "La firma admite hasta 60 caracteres."),
}).strict();
export const dedicationsSchema = z.array(dedicationSchema).max(198, "Revisa la cantidad de tarjetas.");
export type Dedication = z.infer<typeof dedicationSchema>;

export function resizeDedications(current: Dedication[], count: number): Dedication[] {
  return Array.from({ length: Math.min(198, Math.max(0, count)) }, (_, index) => current[index] ?? { message: "", signature: "" });
}

export function hasDedication(entries: Dedication[] | undefined) {
  return Boolean(entries?.some(entry => entry.message.trim() || entry.signature.trim()));
}
