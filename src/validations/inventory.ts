import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  sku: z.string().trim().max(60).optional().nullable(),
  item_type: z.enum(["flor", "insumo", "componente", "producto"], {
    message: "El tipo debe ser flor, insumo, componente o producto.",
  }),
  unit: z.string().trim().min(1).max(30).optional().default("unidad"),
  minimum_stock: z.coerce.number().min(0, "El stock mínimo no puede ser negativo.").optional().default(0),
});

export const updateInventoryItemSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    sku: z.string().trim().max(60).nullable(),
    unit: z.string().trim().min(1).max(30),
    minimum_stock: z.coerce.number().min(0),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay cambios para actualizar.",
  });

export const createInventoryEntrySchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido."),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
  unit_cost: z.coerce.number().min(0).optional().nullable(),
  supplier_name: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  received_at: z.string().optional(),
});

export const createInventoryWasteSchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido."),
  lot_id: z.string().uuid("El lote no es válido.").optional().nullable(),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que cero."),
  reason: z.string().trim().min(1, "El motivo de la merma es obligatorio.").max(500),
});

export const createInventoryAdjustmentSchema = z.object({
  inventory_item_id: z.string().uuid("El ítem de inventario no es válido."),
  quantity_delta: z.coerce
    .number()
    .refine((v) => v !== 0, "El ajuste no puede ser cero."),
  reason: z.string().trim().min(1, "El motivo del ajuste es obligatorio.").max(500),
});