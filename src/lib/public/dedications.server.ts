import { createAdminClient } from "@/lib/supabase/admin";

// Return only a card count. Recipes, stock and supply identifiers remain private.
export async function dedicationCardCount(productId: string, optionIds: string[] = []): Promise<number> {
  const { data, error } = await createAdminClient().rpc("product_dedication_card_count", { p_product_id: productId, p_option_ids: optionIds });
  const count = Number(data);
  if (error || !Number.isInteger(count) || count < 0) throw new Error("No se pudo comprobar la personalización del producto.");
  return count;
}
