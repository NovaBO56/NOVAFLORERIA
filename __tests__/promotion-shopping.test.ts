import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { addCartBatch, addItem, removeItem, type CartItem } from "@/lib/public/cart-logic";
import { canBuildCombo, promotionPricePreview, promotionProgress } from "@/lib/public/promotion-shopping";
import { cartPromotion } from "@/lib/public/cart-promotions";
import type { PublicProduct, PublicPromotion } from "@/lib/public/types";
vi.mock("@/components/public/home/shared", () => ({ script: { className: "script" } }));
vi.mock("@/components/public/safe-image", () => ({ SafeImage: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }) }));
import { PromotionSection } from "@/components/public/home/promotion-section";
import { PromotionCartSummary } from "@/components/public/promotion-cart-summary";
import { CheckoutForm } from "@/components/public/checkout-form";

const rose: PublicProduct = { id: "rose", name: "Ramo participante", price: 100, category_id: null, occasion: null, season_id: null, is_featured: false, is_available: true, is_sold_out: false, catalog_order: 1, images: [{ id: "image", public_url: "/rose.png", alt_text: "Ramo real configurado", sort_order: 0 }] };
const gift = { ...rose, id: "gift", name: "Regalo participante", price: 50, images: [] };
const promotion: PublicPromotion = { id: "offer", name: "Oferta configurada", description: "Descripción real configurada", promotion_type: "producto", discount_type: "porcentaje", discount_value: 10, combo_price: null, minimum_purchase: null, starts_at: null, ends_at: null, products: [{ product_id: rose.id, quantity: 1, unit_price: rose.price, product: rose }] };
const combo: PublicPromotion = { ...promotion, promotion_type: "combo", discount_type: null, discount_value: null, combo_price: 120, products: [...promotion.products!, { product_id: gift.id, quantity: 1, unit_price: gift.price, product: gift }] };
const roseLine: CartItem = { id: "rose", name: rose.name, price: 100, quantity: 1, image: null, available: true };
const giftLine = { ...roseLine, id: "gift", name: gift.name, price: 50 };

describe("Connected promotion shopping (unit/markup, not browser evidence)", () => {
  it("shows a real participant, real image, old/new prices and a purchase action", () => {
    const html = renderToStaticMarkup(createElement(PromotionSection, { promotions: [promotion], onChooseProduct: () => {} }));
    for (const text of [rose.name, "/rose.png", "Bs 100.00", "Bs 90.00", "Comprar esta oferta"]) expect(html).toContain(text);
    expect(html).not.toContain('href="#catalogo"');
  });
  it("renders only one offer at a time and accessible carousel controls", () => {
    const html = renderToStaticMarkup(createElement(PromotionSection, { promotions: [promotion, { ...promotion, id: "other", name: "Otra oferta" }] }));
    expect(html).toContain('aria-roledescription="carrusel"'); expect(html).toContain("Promoción siguiente"); expect(html.match(/<article/g)).toHaveLength(1); expect(html).toContain('aria-current="true"');
  });
  it("return from cart opens the exact selected offer", () => {
    const html = renderToStaticMarkup(createElement(PromotionSection, { promotions: [promotion, { ...promotion, id: "other", name: "Otra oferta" }], initialPromotionId: "other" }));
    expect(html).toContain('aria-label="2 de 2"'); expect(html).toContain('Otra oferta</h3>');
  });
  it("hides expired offers and never invents global eligibility", () => {
    expect(renderToStaticMarkup(createElement(PromotionSection, { promotions: [{ ...promotion, ends_at: "2000-01-01" }] }))).toBe("");
    expect(promotionPricePreview({ ...promotion, products: [] })).toBeNull();
  });
  it("shows combo composition and only offers guided purchase for complete purchasable integer components", () => {
    const html = renderToStaticMarkup(createElement(PromotionSection, { promotions: [combo], onBuildCombo: () => {} }));
    expect(html).toContain("Comprar combo"); expect(html).toContain("1 × Regalo participante"); expect(html).toContain("Bs 120.00");
    expect(canBuildCombo(combo)).toBe(true);
    expect(canBuildCombo({ ...combo, products: [{ ...combo.products![0], quantity: .5 }] })).toBe(false);
    expect(canBuildCombo({ ...combo, products: [{ ...combo.products![0], product: null }] })).toBe(false);
  });
  it("minimum has no premature discount or misleading one-unit price", () => {
    const minimum = { ...promotion, minimum_purchase: 150 };
    expect(promotionPricePreview(minimum)).toBeNull(); expect(promotionProgress(minimum, [roseLine])).toContain("Bs 50.00"); expect(cartPromotion(minimum, [roseLine])).toBeNull();
    expect(promotionProgress(minimum, [roseLine, giftLine])).toBeNull();
  });
  it("removing a required combo line withdraws its benefit with a helpful message", () => {
    expect(cartPromotion(combo, [roseLine, giftLine])?.discount).toBe(30);
    const incomplete = removeItem([roseLine, giftLine], "gift");
    expect(cartPromotion(combo, incomplete)).toBeNull(); expect(promotionProgress(combo, incomplete)).toContain("Regalo participante");
  });
  it("adds personalized combo atomically and preserves surcharge/message", () => {
    const items = addCartBatch([], [{ product: { ...roseLine, options: [{ id: "wrap", name: "Envoltura", extra_price: 5 }], message: "Para ti", price: 105 }, quantity: 1 }, { product: giftLine, quantity: 1 }]);
    expect(items[0]).toMatchObject({ price: 105, message: "Para ti" }); expect(cartPromotion(combo, items)).toMatchObject({ discount: 30, total: 125 });
  });
  it("does not partially add a combo when a cart limit would truncate it", () => {
    const original = [{ ...roseLine, quantity: 99 }];
    expect(() => addCartBatch(original, [{ product: giftLine, quantity: 1 }, { product: roseLine, quantity: 1 }])).toThrow(); expect(original).toEqual([{ ...roseLine, quantity: 99 }]);
  });
  it("mixed cart discounts only participants and does not stack promotions", () => {
    expect(cartPromotion(promotion, [roseLine, giftLine])).toMatchObject({ discount: 10, total: 140 });
    expect(cartPromotion({ ...promotion, discount_type: "monto_fijo", discount_value: 20 }, [roseLine, giftLine])).toMatchObject({ discount: 20, total: 130 });
  });
  it("cart shows benefit, unmet conditions, removal and return to offer", () => {
    const html = renderToStaticMarkup(createElement(PromotionCartSummary, { promotions: [combo], selectedId: combo.id, items: [roseLine], onSelect: () => {}, onBrowse: () => {} }));
    expect(html).toContain("Completa el combo"); expect(html).toContain("Volver a la oferta"); expect(html).not.toContain("Descuento estimado: −Bs 30.00");
  });
  it("price preview accounts for complete configured quantities", () => {
    expect(promotionPricePreview(combo)).toEqual({ before: 150, after: 120 });
    expect(cartPromotion(combo, addItem([roseLine, giftLine], roseLine))).toMatchObject({ discount: 30, total: 220 });
  });
  it("checkout preserves the selected offer and displays the matching estimated total", () => {
    const html = renderToStaticMarkup(createElement(CheckoutForm, { details: { customer_name: "", customer_phone: "", delivery: "retiro", address: "", reference: "", notes: "", promotion_id: promotion.id }, update: () => {}, items: [roseLine, giftLine], total: 150, unavailable: false, busy: false, status: null, promotions: [promotion], createOrder: async () => {} }));
    expect(html).toContain("Descuento estimado: −Bs 10.00"); expect(html).toContain("Bs 140.00"); expect(html).toContain("Recojo sin envío");
  });
});
