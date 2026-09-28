import { z } from "zod";

export const MOVEMENT_TYPES = [
  "entrada",
  "salida",
  "merma",
  "ajuste",
  "devolucion",
  "reversion",
] as const;

// GET /api/admin/inventory/lots
// only_available = "true" (por defecto): solo lotes con saldo, en orden FIFO.
// only_available = "false": incluye lotes agotados (historial de lotes).
export const listLotsQuerySchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido.").optional(),
  only_available: z.enum(["true", "false"], { message: "only_available debe ser true o false." }).optional().default("true"),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

// GET /api/admin/inventory/movements
export const listMovementsQuerySchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido.").optional(),
  movement_type: z.enum(MOVEMENT_TYPES, { message: "Tipo de movimiento no válido." }).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
