import { createAdminClient } from "@/lib/supabase/admin";
import { withProductAvailability } from "@/lib/public/product-availability.server";
import type { PublicProduct } from "@/lib/public/types";

const publicFields = "id,name,price,category_id,occasion,season_id,is_featured,is_available,is_sold_out,catalog_order,images:product_images(id,public_url,alt_text,sort_order)";
export async function recommendationProducts(ids: string[], admin = false) {
  if (!ids.length) return [];
  const products: (PublicProduct & { is_active?: boolean })[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    let query = createAdminClient().from("products").select(admin ? `${publicFields},is_active` : publicFields).in("id", ids.slice(offset, offset + 100)).order("sort_order", { foreignTable: "product_images" });
    if (!admin) query = query.eq("is_active", true).eq("is_available", true).eq("is_sold_out", false);
    const { data, error } = await query;
    if (error) throw new Error("Recommendation products unavailable");
    products.push(...await withProductAvailability((data ?? []) as unknown as (PublicProduct & { is_active?: boolean })[]));
  }
  return ids.flatMap(id => products.filter(p => p.id === id));
}
export async function resolvedRecommendations(id: string, excluded: string[] = []) {
  const { data, error } = await createAdminClient().rpc("resolve_product_recommendation_ids", { p_product: id });
  if (error || !Array.isArray(data)) throw new Error("Recommendation configuration unavailable");
  const ids = (data as string[]).filter(candidate => candidate !== id && !excluded.includes(candidate));
  return (await recommendationProducts(ids)).filter(p => p.is_available && !p.is_sold_out).slice(0, 4);
}
