import { z } from "zod";

export const openCashSessionSchema = z.object({
  cash_register_id: z.string().uuid("La caja no es válida."),
  opening_amount: z.coerce.number().min(0, "El monto de apertura no puede ser negativo."),
});

export const closeCashSessionSchema = z.object({
  counted_amount: z.coerce.number().min(0, "El monto contado no puede ser negativo."),
  closing_note: z.string().trim().max(1000).optional().nullable(),
});

export const recordCashMovementSchema = z
  .object({
    movement_type: z.enum(["ingreso", "gasto", "ajuste", "devolucion"], {
      message: "Tipo de movimiento no válido.",
    }),
    amount: z.coerce.number().positive("El monto debe ser mayor que cero."),
    direction: z.enum(["entrada", "salida"]).optional().nullable(),
    reason: z.string().trim().max(500).optional().nullable(),
    order_id: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.movement_type === "ajuste" && !data.direction) {
      ctx.addIssue({
        code: "custom",
        path: ["direction"],
        message: "Un ajuste debe indicar dirección: entrada o salida.",
      });
    }
    if (data.movement_type !== "ajuste" && data.direction) {
      ctx.addIssue({
        code: "custom",
        path: ["direction"],
        message: "La dirección solo aplica a movimientos de tipo 'ajuste'.",
      });
    }
    if (
      ["gasto", "ajuste", "devolucion"].includes(data.movement_type) &&
      (!data.reason || data.reason.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "El motivo es obligatorio para este tipo de movimiento.",
      });
    }
  });