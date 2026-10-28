import { primaryProductImage, type ProductImageSource } from "@/lib/product-images";

type HistoricalItem = { product_name: string; quantity: number | string; unit_price: number | string; line_total: number | string };
export type OrderImageRow = {
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number | string;
  unit_price_snapshot: number | string;
  line_total: number | string;
  product: { images?: ProductImageSource[] | null } | { images?: ProductImageSource[] | null }[] | null;
};

function identity(name: string, quantity: number | string, price: number | string, total: number | string) {
  const values = [Number(quantity), Number(price), Number(total)];
  return typeof name === "string" && values.every(Number.isFinite) ? JSON.stringify([name, ...values]) : null;
}

/** Add only a current catalogue photograph. Ambiguous historical names never guess a product. */
export function withOrderItemImages<T extends HistoricalItem>(items: readonly T[], rows: readonly OrderImageRow[] = []): (T & { image_url: string | null })[] {
  const groups = new Map<string, OrderImageRow[]>();
  for (const row of rows) {
    const key = identity(row.product_name_snapshot, row.quantity, row.unit_price_snapshot, row.line_total);
    if (key) groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return items.map(item => {
    const key = identity(item.product_name, item.quantity, item.unit_price, item.line_total);
    const candidates = key ? groups.get(key) ?? [] : [];
    const ids = new Set(candidates.map(row => row.product_id));
    const unique = ids.size === 1 && Boolean(candidates[0]?.product_id);
    const images = unique ? candidates.flatMap(row => {
      const product = Array.isArray(row.product) ? row.product[0] : row.product;
      return product?.images ?? [];
    }) : [];
    return { ...item, image_url: primaryProductImage(images)?.public_url ?? null };
  });
}
