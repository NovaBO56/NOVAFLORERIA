export type ProductImageSource = {
  public_url?: string | null;
  alt_text?: string | null;
  sort_order?: number | null;
};

/** A saved, usable image with the lowest display order. Never mutates the catalog. */
export function primaryProductImage<T extends ProductImageSource>(
  images?: readonly T[] | null,
): T | null {
  return [...(images ?? [])]
    .filter(image => typeof image.public_url === "string" && image.public_url.trim().length > 0)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))[0] ?? null;
}
