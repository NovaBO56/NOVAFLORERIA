import { z } from "zod";

export const orderScheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indica una fecha válida."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indica una hora válida."),
  status: z.enum(["proposed", "confirmed"]),
  client_confirmed: z.boolean(),
  revision: z.number().int().min(0),
}).strict().superRefine((value, ctx) => {
  const parsed = new Date(`${value.date}T${value.time}:00-04:00`);
  if (Number.isNaN(parsed.valueOf()) || new Date(parsed.valueOf() - 4 * 3600000).toISOString().slice(0, 16) !== `${value.date}T${value.time}`) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "La fecha no existe." });
  }
  if (value.client_confirmed !== (value.status === "confirmed")) ctx.addIssue({ code: "custom", path: ["client_confirmed"], message: "Confirma expresamente que coordinaste el horario con el cliente." });
});

export function scheduleInstant(date: string, time: string) {
  return new Date(`${date}T${time}:00-04:00`).toISOString();
}
