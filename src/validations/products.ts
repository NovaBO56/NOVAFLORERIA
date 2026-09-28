import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre del producto es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0, "El precio debe ser un número mayor o igual a cero."),
  category_id: z.string().uuid().optional().nullable(),
  occasion: z.string().trim().max(120).optional().nullable(),
  season_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean().optional().default(false),
  is_available: z.boolean().optional().default(true),
  is_sold_out: z.boolean().optional().default(false),
  catalog_order: z.coerce
    .number()
    .int("El orden del catálogo debe ser un número entero mayor o igual a cero.")
    .min(0)
    .optional()
    .default(0),
  is_active: z.boolean().optional().default(true),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable(),
    price: z.coerce.number().min(0),
    category_id: z.string().uuid().nullable(),
    occasion: z.string().trim().max(120).nullable(),
    season_id: z.string().uuid().nullable(),
    is_featured: z.boolean(),
    is_available: z.boolean(),
    is_sold_out: z.boolean(),
    catalog_order: z.coerce.number().int().min(0),
    is_active: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No hay datos para actualizar.",
  });

// Columnas por las que se puede ordenar. Whitelist explícita: nunca se
// pasa un nombre de columna del query string directo a .order().
const SORTABLE_COLUMNS = ["name", "price", "catalog_order", "created_at", "updated_at"] as const;

const booleanParam = z.enum(["true", "false"]).transform((v) => v === "true");

// GET /api/admin/products
// Todos los filtros son opcionales. Si no se manda "limit", no se pagina
// (se devuelve todo lo que matchee, igual que el comportamiento anterior)
// para no romper pantallas que ya consumen este endpoint sin parámetros.
export const listProductsQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(200).optional(),
    category_id: z.string().uuid("category_id no es válido.").optional(),
    season_id: z.string().uuid("season_id no es válido.").optional(),
    is_active: booleanParam.optional(),
    is_available: booleanParam.optional(),
    is_sold_out: booleanParam.optional(),
    is_featured: booleanParam.optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    sort: z.enum(SORTABLE_COLUMNS, { message: "Columna de orden no válida." }).optional(),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .refine((data) => data.min_price === undefined || data.max_price === undefined || data.min_price <= data.max_price, {
    message: "min_price no puede ser mayor a max_price.",
    path: ["min_price"],
  });