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

  it.each(["b0000000-0000-4000-8000-000000000002", ""])("restores the original pending-attempt promotion when another tab now selects %j", async currentId => {
    storage({ "nova-promotion-v1": JSON.stringify(currentId) });
    const { checkoutPromotionId, getPromotionSelection } = await import("@/lib/public/promotion-selection");
    const { checkoutSessionKeys, orderPayload, readCheckoutDraft } = await import("@/lib/public/checkout");
    const originalId = "a0000000-0000-4000-8000-000000000001";
    const originalDetails = { customer_name: "Cliente de prueba", customer_phone: "70000001", delivery: "retiro" as const, address: "", reference: "", notes: "", promotion_id: originalId };
    const items = [{ id: "550e8400-e29b-41d4-a716-446655440000", name: "Ramo", price: 100, quantity: 1, image: null, available: true }];
    const originalAttempt = { key: "550e8400-e29b-41d4-a716-446655440001", fingerprint: JSON.stringify(orderPayload(items, originalDetails, "preview")) };
    const values = new Map<string, string>([[checkoutSessionKeys.draft, JSON.stringify(originalDetails)], [checkoutSessionKeys.attempt, JSON.stringify(originalAttempt)]]);
    const session = { getItem: (key: string) => values.get(key) ?? null };
    const attempt = JSON.parse(session.getItem(checkoutSessionKeys.attempt)!);
    const draft = readCheckoutDraft(session)!;
    const restored = { ...draft, promotion_id: checkoutPromotionId(getPromotionSelection(), draft.promotion_id, Boolean(attempt)) };
    expect(restored.promotion_id).toBe(originalId);
    expect(JSON.stringify(orderPayload(items, restored, "preview"))).toBe(attempt.fingerprint);
    expect(orderPayload(items, restored, attempt.key).idempotency_key).toBe(originalAttempt.key);
  });
  it("keeps an originally promotion-free retry while fresh checkouts respect a changed or cleared intent", async () => {
    storage();
    const { checkoutPromotionId } = await import("@/lib/public/promotion-selection");
    const original = "a0000000-0000-4000-8000-000000000001";
    const latest = "b0000000-0000-4000-8000-000000000002";
    expect(checkoutPromotionId(latest, "", true)).toBe("");
    expect(checkoutPromotionId(latest, original, false)).toBe(latest);
    expect(checkoutPromotionId("", original, false)).toBe("");
    expect(checkoutPromotionId(null, original, false)).toBe(original);
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
