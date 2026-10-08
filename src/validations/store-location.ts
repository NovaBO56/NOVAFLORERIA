import { z } from "zod";

export function isMapsUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && (url.hostname === "maps.app.goo.gl" || url.hostname === "maps.google.com" || (url.hostname === "www.google.com" && url.pathname.startsWith("/maps"))); } catch { return false; }
}
const coordinate = (min: number, max: number) => z.preprocess(value => value === "" || value === null || value === undefined ? null : value, z.coerce.number().finite().min(min).max(max).nullable());
export const storeLocationSchema = z.object({
  branch_name: z.string().trim().max(120).default(""),
  address: z.string().trim().max(400).default(""),
  reference: z.string().trim().max(400).default(""),
  maps_url: z.string().trim().max(2000).refine(value => !value || isMapsUrl(value), "Usa un enlace HTTPS válido de Google Maps.").default(""),
  latitude: coordinate(-90, 90), longitude: coordinate(-180, 180),
  directions: z.string().trim().max(400).default(""),
}).refine(value => (value.latitude === null) === (value.longitude === null), { message: "Completa ambas coordenadas.", path: ["longitude"] });
export type StoreLocation = z.infer<typeof storeLocationSchema>;
export function mapsDestination(location: StoreLocation) {
  if (location.maps_url && isMapsUrl(location.maps_url)) return location.maps_url;
  return location.latitude !== null && location.longitude !== null ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}` : null;
}
