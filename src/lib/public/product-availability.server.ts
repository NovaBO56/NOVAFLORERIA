import { createAdminClient } from "@/lib/supabase/admin";

export type AvailabilityItem = { product_id: string; quantity?: number; customization_option_ids?: string[] };
export type Availability = { line_index: number; product_id: string; available_quantity: number; is_available: boolean; is_sold_out: boolean };

// Only aggregate sellability leaves the server, never recipes, lots or inventory IDs.
export async function productAvailability(items: AvailabilityItem[], combine = false): Promise<Availability[]> {
  if (!items.length) return [];
  const { data, error } = await createAdminClient().rpc("get_product_availability", { p_items: items, p_combine: combine });
  if (error || !Array.isArray(data) || data.length !== items.length) throw new Error("No se pudo comprobar la disponibilidad.");
  return data.map((row, index) => {
    const quantity = Number(row.available_quantity);
    if (row.product_id !== items[index].product_id || row.line_index !== index || !Number.isFinite(quantity) || quantity < 0
      || typeof row.is_available !== "boolean" || typeof row.is_sold_out !== "boolean") throw new Error("No se pudo comprobar la disponibilidad.");
    return { line_index: row.line_index, product_id: row.product_id, available_quantity: quantity,
      is_available: row.is_available, is_sold_out: row.is_sold_out };
  });
}

export async function withProductAvailability<T extends { id: string; is_available: boolean; is_sold_out: boolean }>(products: T[]): Promise<(T & { available_quantity: number })[]> {
  const availability = await productAvailability(products.map(product => ({ product_id: product.id })));
  return products.map((product, index) => ({ ...product, available_quantity: availability[index].available_quantity,
    is_available: availability[index].is_available, is_sold_out: availability[index].is_sold_out }));
}
