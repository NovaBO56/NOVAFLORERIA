import { z } from "zod";
const assetPath = z.string().regex(/^storefront\/(?:logo|about|category)\/[0-9a-f-]{36}\.webp$/);
export const storefrontMediaSchema = z.object({ logo: assetPath.nullable(), about: assetPath.nullable(), categories: z.record(z.string().uuid(), assetPath) });
export type StorefrontMedia = { logo: string | null; about: string | null; categories: Record<string, string> };
export const emptyStorefrontMedia: StorefrontMedia = { logo: null, about: null, categories: {} };
export function publicStorefrontMedia(value: unknown, storageBase: string): StorefrontMedia {
  const parsed = storefrontMediaSchema.safeParse(value);
  if (!parsed.success) return emptyStorefrontMedia;
  const url = (p: string) => `${storageBase.replace(/\/$/, "")}/storage/v1/object/public/product-images/${p}`;
  return { logo: parsed.data.logo ? url(parsed.data.logo) : null, about: parsed.data.about ? url(parsed.data.about) : null, categories: Object.fromEntries(Object.entries(parsed.data.categories).map(([key,p]) => [key,url(p)])) };
}
