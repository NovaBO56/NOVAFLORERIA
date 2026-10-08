import { z } from "zod";

const SORTABLE_COLUMNS = ["name", "price", "catalog_order", "created_at"] as const;

const booleanParam = z.enum(["true", "false"]).transform((v) => v === "true");

// GET /api/products — catálogo público. No hay filtro is_active: el
// servidor SIEMPRE fuerza is_active=true, el visitante no puede pedir ver
// productos inactivos (a diferencia del listado de /admin/products).
export const listPublicProductsQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(200).optional(),
    category_id: z.string().uuid("category_id no es válido.").optional(),
    season_id: z.string().uuid("season_id no es válido.").optional(),
    occasion: z.string().trim().max(120).optional(),
    is_featured: booleanParam.optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    sort: z.enum(SORTABLE_COLUMNS, { message: "Columna de orden no válida." }).optional(),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(60).optional().default(24),
  })
  .refine((data) => data.min_price === undefined || data.max_price === undefined || data.min_price <= data.max_price, {
    message: "min_price no puede ser mayor a max_price.",
    path: ["min_price"],
  });

export const trackOrderSchema = z.object({
  order_number: z.coerce.number().int().positive("El número de pedido no es válido.").optional(),
  order_id: z.string().uuid().optional(),
  customer_phone: z.string().trim().min(6, "El teléfono no es válido.").max(30),
}).refine(data => Boolean(data.order_number || data.order_id), { message: "Indica el número de pedido." });
