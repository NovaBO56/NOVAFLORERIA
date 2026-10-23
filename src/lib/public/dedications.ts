import { z } from "zod";

// Intent is draft-only: persist incomplete edits in the existing cart, but never
// write UI state into order_items.dedications or trust it as a recipe change.
export const dedicationDraftSchema = z.object({
  message: z.string().max(250, "La dedicatoria admite hasta 250 caracteres."),
  signature: z.string().max(60, "La firma admite hasta 60 caracteres."),
  intent: z.enum(["write", "blank"]).optional(),
}).strict();
export const dedicationDraftsSchema = z.array(dedicationDraftSchema).max(198, "Revisa la cantidad de tarjetas.");
export const dedicationSchema = dedicationDraftSchema.superRefine((entry, context) => {
  if (entry.intent === "write" && !entry.message.trim()) context.addIssue({ code: "custom", path: ["message"], message: "Escribe el mensaje de tu tarjeta o elige dejarla en blanco." });
  if (entry.intent === "blank" && (entry.message || entry.signature)) context.addIssue({ code: "custom", message: "La tarjeta en blanco no debe incluir un mensaje o firma." });
}).transform(({ message, signature }) => ({ message, signature }));
export const dedicationsSchema = z.array(dedicationSchema).max(198, "Revisa la cantidad de tarjetas.");
export type Dedication = z.infer<typeof dedicationDraftSchema>;

export function resizeDedications(current: Dedication[], count: number): Dedication[] {
  return Array.from({ length: Math.min(198, Math.max(0, count)) }, (_, index) => current[index] ?? { message: "", signature: "" });
}

export function hasDedication(entries: Dedication[] | undefined) {
  return Boolean(entries?.some(entry => entry.message.trim() || entry.signature.trim()));
}
