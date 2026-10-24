import type { BusinessStatus, ProductDetail, PublicCategory, PublicPromotion, WeekDay } from "@/lib/public/types";
import { listPublicProductsQuerySchema } from "@/validations/public-catalog";
import { z } from "zod";

export type VisualSnapshot = {
  version: 1; synthetic: true; products: ProductDetail[]; promotions: PublicPromotion[];
  categories: PublicCategory[]; hours: { status: BusinessStatus; week: WeekDay[] };
};
export const visualOnlyMessage = "Vista previa visual: no se registran pedidos, pagos ni operaciones. Los datos son sintéticos.";

/** Read-only projection of an explicitly exported LOCAL public catalogue. No database client. */
export function visualCatalogResponse(snapshot: VisualSnapshot, url: URL) {
  const route = url.searchParams.get("path");
  const ok = (data: object) => ({ status: 200, body: { success: true, visual_preview: true, ...data } });
  const fail = (status: number, message = visualOnlyMessage) => ({ status, body: { success: false, message, visual_preview: true } });
  if (route === "/api/products") {
    const parsed = listPublicProductsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail(400, "Filtros inválidos.");
    const q = parsed.data;
    const products = snapshot.products.filter(p => (!q.search || p.name.toLocaleLowerCase().includes(q.search.toLocaleLowerCase())) && (!q.category_id || p.category_id === q.category_id) && (!q.season_id || p.season_id === q.season_id) && (!q.occasion || p.occasion === q.occasion) && (q.is_featured === undefined || p.is_featured === q.is_featured) && (q.min_price === undefined || p.price >= q.min_price) && (q.max_price === undefined || p.price <= q.max_price));
    products.sort((a, b) => {
      const key = q.sort === "name" || q.sort === "price" || q.sort === "catalog_order" ? q.sort : "catalog_order";
      const left = a[key], right = b[key];
      return (typeof left === "string" && typeof right === "string" ? left.localeCompare(right) : Number(left) - Number(right)) * (q.order === "desc" ? -1 : 1) || a.id.localeCompare(b.id);
    });
    return ok({ products: products.slice((q.page - 1) * q.limit, q.page * q.limit), pagination: { page: q.page, limit: q.limit, total: products.length, total_pages: Math.max(1, Math.ceil(products.length / q.limit)) } });
  }
  if (route?.startsWith("/api/products/")) {
    const id = route.slice("/api/products/".length);
    if (!z.string().uuid().safeParse(id).success) return fail(400, "ID no válido.");
    const product = snapshot.products.find(p => p.id === id);
    return product ? ok({ product }) : fail(404, "El producto no existe.");
  }
  if (route === "/api/categories") return ok({ categories: snapshot.categories });
  if (route === "/api/promotions") return ok({ promotions: snapshot.promotions });
  if (route === "/api/business-hours") return ok(snapshot.hours);
  if (route === "/api/store-location") return ok({ location: null });
  if (route === "/api/storefront-media") return ok({ media: { logo: null, about: null, categories: {} } });
  if (route === "/api/whatsapp-config" || route === "/api/payment-qr") return fail(404, "Contacto y pagos deshabilitados en la vista previa visual. NO PAGAR.");
  return fail(403);
}
