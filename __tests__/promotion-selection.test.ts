import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/components/public/safe-image", () => ({ SafeImage: () => null }));
vi.mock("@/components/public/home/shared", () => ({ script: { className: "script" }, useDialog: () => {} }));

describe("Promotion intent persistence; prices and discounts are never stored", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  function storage(initial: Record<string, string> = {}) {
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => initial[key] ?? null, setItem: (key: string, value: string) => { initial[key] = value; } }, addEventListener: () => {}, removeEventListener: () => {} });
    return initial;
  }
  it("reloads the selected UUID between store and checkout without persisting a price", async () => {
    const values = storage(); const id = "a0000000-0000-4000-8000-000000000001";
    const selection = await import("@/lib/public/promotion-selection"); selection.selectPromotion(id);
    expect(values["nova-promotion-v1"]).toBe(JSON.stringify(id));
    vi.resetModules(); expect((await import("@/lib/public/promotion-selection")).getPromotionSelection()).toBe(id);
  });
  it("explicitly clearing an offer stays empty after reload and overrides a stale draft", async () => {
    storage(); const selection = await import("@/lib/public/promotion-selection"); selection.selectPromotion("");
    vi.resetModules(); const value = (await import("@/lib/public/promotion-selection")).getPromotionSelection();
    expect(value ?? "old-draft-offer").toBe("");
  });
  it("an absent or malformed intent permits safe legacy draft recovery", async () => {
    storage({ "nova-promotion-v1": JSON.stringify({ promotion_id: "fake", discount: 100 }) });
    expect((await import("@/lib/public/promotion-selection")).getPromotionSelection()).toBeNull();
  });
  it("a new purchase starts without old cart lines or promotion and preserves previous tracking", async () => {
    const values = storage();
    const sessionValues = new Map<string, string>();
    const session = { getItem: (key: string) => sessionValues.get(key) ?? null, setItem: (key: string, value: string) => { sessionValues.set(key, value); }, removeItem: (key: string) => { sessionValues.delete(key); } };
    const { addToCart, clearCart } = await import("@/components/public/home/cart");
    const { selectPromotion } = await import("@/lib/public/promotion-selection");
    const { beginAnotherPurchase, readPreviousPurchase } = await import("@/lib/public/previous-purchase");
    const product = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Prueba", price: 45, category_id: null, occasion: null, season_id: null, is_featured: false, is_available: true, is_sold_out: false, catalog_order: 1, images: [] };
    addToCart(product); selectPromotion("a0000000-0000-4000-8000-000000000001");
    const previous = { id: product.id, phone: "00001234", number: 123 };
    expect(beginAnotherPurchase(session, previous)).toBe(true); clearCart();
    expect(JSON.parse(values["nova-cart-v1"])).toEqual([]);
    expect(JSON.parse(values["nova-promotion-v1"])).toBe("");
    addToCart({ ...product, id: "550e8400-e29b-41d4-a716-446655440001", name: "Nueva compra" });
    expect(JSON.parse(values["nova-cart-v1"])).toHaveLength(1);
    expect(JSON.parse(values["nova-cart-v1"])[0].name).toBe("Nueva compra");
    expect(readPreviousPurchase(session)).toEqual(previous);
  });
});
