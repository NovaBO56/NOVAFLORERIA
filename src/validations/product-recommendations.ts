import { z } from "zod";
const ids = (max: number) => z.array(z.string().uuid()).max(max).refine(values => new Set(values).size === values.length, "No repitas productos o categorías.");
export const globalRecommendationsSchema = z.object({
  enabled: z.boolean(), scope: z.enum(["all", "categories"]), product_ids: ids(20),
  category_ids: ids(100), excluded_category_ids: ids(100), excluded_product_ids: ids(200), revision: z.number().int().min(0),
}).strict().refine(value => !value.enabled || value.scope !== "categories" || value.category_ids.length > 0, "Selecciona al menos una categoría.");
export const customRecommendationsSchema = z.object({ product_ids: ids(4), revision: z.number().int().min(0).optional() }).strict();
export const recommendationModeSchema = z.object({ mode: z.enum(["global", "custom", "off"]), revision: z.number().int().min(0), product_ids: ids(4).optional() }).strict().refine(v => v.mode === "custom" ? v.product_ids !== undefined : v.product_ids === undefined);
export type GlobalRecommendations = z.infer<typeof globalRecommendationsSchema>;
export const emptyGlobalRecommendations: GlobalRecommendations = { enabled: false, scope: "all", product_ids: [], category_ids: [], excluded_category_ids: [], excluded_product_ids: [], revision: 0 };
