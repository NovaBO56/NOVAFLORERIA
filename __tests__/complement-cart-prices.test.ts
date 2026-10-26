import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicProduct } from "@/lib/public/types";

vi.mock("@/components/public/safe-image", () => ({ SafeImage: () => null }));
vi.mock("@/components/public/home/shared", () => ({ script: { className: "script" }, useDialog: () => {} }));

// Unit regression of the actual cart implementation; no browser, HTTP or DB proof.
describe("Optional commercial products use current prices in the existing cart", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  function storage() {
    const values: Record<string, string> = {};
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => values[key] ?? null, setItem: (key: string, value: string) => { values[key] = value; } }, addEventListener: () => {}, removeEventListener: () => {} });
    return values;
  }
  const product: PublicProduct = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Complemento unitario", price: 35, category_id: null, season_id: null, occasion: null, is_featured: false, is_available: true, is_sold_out: false, catalog_order: 1, images: [] };
  it("adds only the chosen product at its supplied catalog price, with no automatic suggestions", async () => {
    const values = storage();
    const { addToCart } = await import("@/components/public/home/cart");
    addToCart(product, 2);
    const lines = JSON.parse(values["nova-cart-v1"]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ price: 35, quantity: 2 });
  });
  it("refreshes a changed catalog price through the existing availability and detail contracts", async () => {
    const values = storage();
    const { addToCart, refreshCartItems } = await import("@/components/public/home/cart");
    addToCart(product);
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, availability: [{ is_available: true }] }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, product: { ...product, price: 37.5, customization_options: [] } }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await refreshCartItems()).toBe(true);
    expect(JSON.parse(values["nova-cart-v1"])[0].price).toBe(37.5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
