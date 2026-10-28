import { primaryProductImage, type ProductImageSource } from "@/lib/product-images";

export type InventoryVisualItem = { id: string; item_type: string };
type VisualProduct = {
  id: string;
  name: string;
  images?: ProductImageSource[] | null;
  requirements?: { inventory_item_id: string; quantity: number | string }[] | null;
  components?: { id: string }[] | null;
};
export type InventoryImageCandidate = {
  inventory_item_id: string;
  product: VisualProduct | VisualProduct[] | null;
};
export type InventoryPhoto = { image_url: string; image_alt: string };

/** Presentation only. An ambiguous or composed product never represents a stock item. */
export function inventoryPhotos(
  items: readonly InventoryVisualItem[],
  candidates: readonly InventoryImageCandidate[],
): Record<string, InventoryPhoto> {
  const eligible = new Set(items.filter(item => item.item_type === "componente" || item.item_type === "producto").map(item => item.id));
  const productsByItem = new Map<string, Map<string, VisualProduct>>();
  for (const row of candidates) {
    if (!eligible.has(row.inventory_item_id)) continue;
    const product = Array.isArray(row.product) ? (row.product.length === 1 ? row.product[0] : null) : row.product;
    if (!product || !product.id || !Array.isArray(product.requirements) || product.requirements.length !== 1) continue;
    const requirement = product.requirements[0];
    if (requirement.inventory_item_id !== row.inventory_item_id || Number(requirement.quantity) !== 1) continue;
    if (!Array.isArray(product.components) || product.components.length > 0) continue;
    const choices = productsByItem.get(row.inventory_item_id) ?? new Map<string, VisualProduct>();
    choices.set(product.id, product);
    productsByItem.set(row.inventory_item_id, choices);
  }
  const photos: Record<string, InventoryPhoto> = {};
  for (const [itemId, choices] of productsByItem) {
    if (choices.size !== 1) continue;
    const product = [...choices.values()][0];
    const photo = primaryProductImage(product.images);
    if (photo?.public_url) photos[itemId] = { image_url: photo.public_url, image_alt: photo.alt_text || product.name };
  }
  return photos;
}
