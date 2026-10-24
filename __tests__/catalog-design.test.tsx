import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/components/public/home/shared", () => ({ script: { className: "script-font" } }));
vi.mock("@/components/public/safe-image", () => ({ SafeImage: ({ alt }: { alt: string }) => <span>{alt}</span> }));
import { CatalogSection } from "@/components/public/home/catalog";
import { PromotionSection } from "@/components/public/home/promotion-section";
import { CheckoutIntro, CheckoutProgress } from "@/components/public/customer-shell";
import { ProductPlaceholder } from "@/components/public/product-placeholder";
import type { PublicPromotion } from "@/lib/public/types";
import { HeroSection } from "@/components/public/home/sections";
import { createProductSchema, updateProductSchema } from "@/validations/products";
beforeEach(() => vi.stubGlobal("React", React));
const noop = () => {};
const props = {
  promotionsOnly: false, onSelectPromotions: noop,
  promotionContent: <div>OFFERS HERE</div>, onClearFilters: noop,
  categories: [{ id: "configured", name: "Ramos", description: null }], categoriesLoading: false,
  selectedCategory: null, onSelectCategory: noop, searchTerm: "", onClearSearch: noop,
  favoritesOnly: false, onShowAll: noop, state: { status: "ready" as const, items: [], total: 0, hasMore: false, loadingMore: false },
  onRetry: noop, onLoadMore: noop, favoriteIds: [], onToggleFavorite: noop, onAdd: noop, onOpenDetail: noop,
};
describe("Catalog presentation contracts (SSR unit; browser checked separately)", () => {
  it("links Ver categorías to the catalogue without an occasion action", () => {
    const html = renderToStaticMarkup(<HeroSection status={null}/>);
    expect(html).toMatch(/<a href="#catalogo"[^>]*>Ver categorías<\/a>/);
    expect(html).not.toContain("Elegir por ocasión");
  });
  it("keeps the administrative product occasion optional without inferring it from its name", () => {
    const created = createProductSchema.parse({ name: "Ramo de cumpleaños", price: 50 });
    expect(created.occasion).toBeUndefined();
    expect(updateProductSchema.safeParse({ price: 60 }).success).toBe(true);
    expect(updateProductSchema.parse({ occasion: null }).occasion).toBeNull();
  });
  it("keeps categories as the main filter and retains promotions without an occasion filter", () => {
    const html = renderToStaticMarkup(<CatalogSection {...props}/>);
    expect(html).not.toContain('aria-label="Ocasión"'); expect(html).toContain('aria-label="Categorías"');
    expect(html).toContain("Ramos"); expect(html).not.toContain("Graduaciones");
    expect(html).toContain("Todos los productos"); expect(html).toContain("Promociones");
    expect(html).toContain('aria-haspopup="dialog"'); expect(html).toContain("lg:hidden");
  });
  it("replaces product results with the existing offer flow only when selected", () => {
    expect(renderToStaticMarkup(<CatalogSection {...props}/>)).not.toContain("OFFERS HERE");
    const html = renderToStaticMarkup(<CatalogSection {...props} promotionsOnly/>);
    expect(html).toContain("OFFERS HERE"); expect(html).not.toContain("No hay productos disponibles");
  });
  it("shows an honest empty promotions state", () => {
    const html = renderToStaticMarkup(<PromotionSection embedded promotions={[]}/>);
    expect(html).toContain("No hay promociones vigentes"); expect(html).not.toContain("Ofertas para ti");
  });
  it("shows category loading without fabricated values", () => {
    const html = renderToStaticMarkup(<CatalogSection {...props} categories={[]} categoriesLoading/>);
    expect(html).toContain("Cargando categorías"); expect(html).not.toContain(">Ramos<");
  });
  it("keeps a large promotion collection navigable without one button per offer", () => {
    const promotions: PublicPromotion[] = Array.from({ length: 30 }, (_, index) => ({
      id: String(index), name: `Oferta de prueba ${index}`, description: null,
      promotion_type: "producto", discount_type: "porcentaje", discount_value: 10,
      combo_price: null, minimum_purchase: null, starts_at: null, ends_at: null,
    }));
    const html = renderToStaticMarkup(<PromotionSection embedded promotions={promotions} initialPromotionId="29"/>);
    expect(html).toContain('aria-label="30 de 30"');
    expect(html).toContain('aria-label="Elegir promoción"');
    expect(html.match(/<option /g)).toHaveLength(30);
    expect(html.match(/<article /g)).toHaveLength(1);
    expect(html.match(/<button /g)).toHaveLength(2);
    expect(html).toContain('value="29" selected=""');
  });
  it("keeps absent product imagery neutral, without a substitute photo or invented product", () => {
    const html = renderToStaticMarkup(<ProductPlaceholder/>);
    expect(html).toContain("Imagen no disponible");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<iframe");
  });
  it("introduces checkout without implying automatic payment confirmation or changing its four steps", () => {
    const html = renderToStaticMarkup(<><CheckoutIntro/><CheckoutProgress step={2}/></>);
    expect(html).toContain("Completa tu pedido");
    expect(html).toContain("nuestro equipo lo verificará personalmente");
    expect(html.match(/<li /g)).toHaveLength(4);
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Confirmación");
  });
});
