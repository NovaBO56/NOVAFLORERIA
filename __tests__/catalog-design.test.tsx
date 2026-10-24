import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/components/public/home/shared", () => ({ script: { className: "script-font" } }));
vi.mock("@/components/public/safe-image", () => ({ SafeImage: ({ alt }: { alt: string }) => <span>{alt}</span> }));
import { CatalogSection } from "@/components/public/home/catalog";
import { PromotionSection } from "@/components/public/home/promotion-section";
beforeEach(() => vi.stubGlobal("React", React));
const noop = () => {};
const props = {
  occasions: ["Amor"], occasionsUnavailable: false, selectedOccasion: null,
  onSelectOccasion: noop, promotionsOnly: false, onSelectPromotions: noop,
  promotionContent: <div>OFFERS HERE</div>, onClearFilters: noop,
  categories: [{ id: "configured", name: "Ramos", description: null }], categoriesLoading: false,
  selectedCategory: null, onSelectCategory: noop, searchTerm: "", onClearSearch: noop,
  favoritesOnly: false, onShowAll: noop, state: { status: "ready" as const, items: [], total: 0, hasMore: false, loadingMore: false },
  onRetry: noop, onLoadMore: noop, favoriteIds: [], onToggleFavorite: noop, onAdd: noop, onOpenDetail: noop,
};
describe("Catalog presentation contracts (SSR unit; browser checked separately)", () => {
  it("offers real occasions separately from configured categories", () => {
    const html = renderToStaticMarkup(<CatalogSection {...props}/>);
    expect(html).toContain('aria-label="Ocasión"'); expect(html).toContain('aria-label="Categorías"');
    expect(html).toContain("Amor"); expect(html).toContain("Ramos"); expect(html).not.toContain("Graduaciones");
    expect(html).toContain("Toda ocasión"); expect(html).toContain("Promociones");
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
  it("preserves partial failure feedback without inventing filter values", () => {
    const html = renderToStaticMarkup(<CatalogSection {...props} occasions={[]} occasionsUnavailable/>);
    expect(html).toContain("No pudimos cargar las ocasiones"); expect(html).not.toContain(">Amor<");
  });
});
