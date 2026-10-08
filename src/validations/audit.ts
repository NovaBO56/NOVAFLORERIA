import { z } from "zod";

export const auditTrailQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  user_id: z.string().uuid().optional(),
  table: z.enum(["orders", "payments", "inventory_entries", "inventory_adjustments", "inventory_waste", "inventory_items", "inventory_movements", "cash_sessions", "cash_movements", "system_settings", "products", "promotions", "profiles", "whatsapp_config", "payment_qr_config"]).optional(),
  action: z.string().regex(/^[A-Za-z_]+$/).max(80).optional(),
});
