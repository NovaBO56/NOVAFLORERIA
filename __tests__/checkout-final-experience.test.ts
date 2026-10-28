import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PromotionChooser, promotionChoices } from "@/components/public/promotion-chooser";
import { CheckoutPurchaseActions } from "@/components/public/checkout-purchase-actions";
import { PromotionCartSummary } from "@/components/public/promotion-cart-summary";
import { beginAnotherPurchase, previousPurchaseKey, readPreviousPurchase } from "@/lib/public/previous-purchase";
import { checkoutSessionKeys } from "@/lib/public/checkout";
import { cartPromotion } from "@/lib/public/cart-promotions";
import { HeroSection } from "@/components/public/home/sections";
import type { CartItem } from "@/lib/public/cart-logic";
import type { PublicPromotion } from "@/lib/public/types";

vi.mock("@/components/public/home/shared", () => ({ script: { className: "script" } }));
const line: CartItem = { id: "rose", name: "Ramo de prueba", price: 100, quantity: 1, available: true, image: null };
const offer: PublicPromotion = { id: "percent", name: "Oferta configurada", description: null, promotion_type: "producto", discount_type: "porcentaje", discount_value: 10, combo_price: null, minimum_purchase: null, starts_at: null, ends_at: null, products: [{ product_id: "rose", quantity: 1, unit_price: 100 }] };
const larger = { ...offer, id: "larger", name: "Mayor ahorro", discount_value: 20 };
const render = (promotions: PublicPromotion[], selectedId = "") => renderToStaticMarkup(createElement(PromotionChooser, { promotions, selectedId, items: [line], now: Date.now(), onSelect: vi.fn() }));

describe("Final checkout presentation (unit/markup, not browser validation)", () => {
  it("removes the catalogue counter while keeping the configured hours and CTA", () => {
    const html = renderToStaticMarkup(createElement(HeroSection, { status: { is_open: true, opens_at: "08:00:00", closes_at: "20:00:00", is_closed_today: false, accept_orders_outside_hours: false } }));
    expect(html).not.toContain("productos en el catálogo"); expect(html).toContain("horario de hoy"); expect(html).toContain("Explorar catálogo");
  });
  it("suggests the greatest eligible saving without applying or persisting it", () => {
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(createElement(PromotionChooser, { promotions: [offer, larger], selectedId: "", items: [line], now: Date.now(), onSelect }));
    expect(promotionChoices([offer, larger], [line], Date.now())[0].promotion.id).toBe("larger");
    expect(html).toContain('data-promotion-state="suggested"'); expect(html).toContain("Puedes ahorrar Bs 20.00"); expect(html).toContain("Tu total sigue sin descuento"); expect(html).toContain('type="button"'); expect(onSelect).not.toHaveBeenCalled();
  });
  it("preserves a selected smaller discount even when a better offer exists", () => {
    const html = render([offer, larger], offer.id);
    expect(html).toContain('data-promotion-state="selected"'); expect(html).toContain("Descuento estimado: −Bs 10.00"); expect(html).not.toContain("Puedes ahorrar");
    expect(cartPromotion(offer, [line])?.total).toBe(90);
    expect(cartPromotion(larger, [line])?.total).toBe(80);
  });
  it("collapses alternatives, retains no promotion and hides the entire empty choice", () => {
    const html = render([offer, larger]);
    expect(html).toContain("<details"); expect(html).not.toContain("<details open"); expect(html).toContain("Ver otras promociones"); expect(html).toContain("Sin promoción");
    expect(render([])).toBe("");
    expect(renderToStaticMarkup(createElement(PromotionCartSummary, { promotions: [], selectedId: "", items: [line], onSelect: vi.fn() }))).toBe("");
  });
  it("retains unmet or unavailable selections rather than switching silently", () => {
    const html = render([{ ...offer, minimum_purchase: 150 }, larger], offer.id);
    expect(html).toContain("Faltan Bs 50.00"); expect(html).toContain("Compra mínima: Bs 150.00"); expect(html).toContain("no aplicada"); expect(html).not.toContain("Sugerencia");
    expect(render([], offer.id)).toContain('data-promotion-state="invalid"'); expect(render([], offer.id)).toContain("Continuar sin descuento");
  });
  it("does not suggest an expired, incompatible or incomplete combo", () => {
    const expired = { ...larger, ends_at: "2000-01-01" };
    const unrelated = { ...larger, products: [{ product_id: "other", quantity: 1, unit_price: 100 }] };
    const incomplete = { ...larger, promotion_type: "combo" as const, combo_price: 50, products: [...offer.products!, ...unrelated.products] };
    expect(promotionChoices([offer, expired, unrelated, incomplete], [line], Date.now()).map(result => result.promotion.id)).toEqual([offer.id]);
  });
  it("shows one new-purchase action and a distinct numbered tracking link", () => {
    const html = renderToStaticMarkup(createElement(CheckoutPurchaseActions, { number: 123, confirmed: true, disabled: false, onStart: vi.fn() }));
    expect(html.match(/Hacer otra compra/g)).toHaveLength(1); expect(html).toContain("Seguir mi pedido #123"); expect(html).toContain('href="/seguimiento"'); expect(html).toContain("carrito vacío"); expect(html).toContain('type="button"');
  });
});

describe("New purchase preserves previous lookup without recreating an order", () => {
  const previous = { id: "550e8400-e29b-41d4-a716-446655440000", phone: "00001234", number: 123 };
  const storage = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  };
  it("keeps only bounded lookup fields after clearing draft, QR and attempt", () => {
    const session = storage();
    for (const key of Object.values(checkoutSessionKeys)) session.setItem(key, "old");
    expect(beginAnotherPurchase(session, { ...previous, receipt_token: "secret-not-to-persist" } as typeof previous)).toBe(true);
    expect(readPreviousPurchase(session)).toEqual(previous);
    for (const key of Object.values(checkoutSessionKeys)) expect(session.getItem(key)).toBeNull();
    expect(session.getItem(previousPurchaseKey)).not.toContain("receipt_token");
  });
  it("does not discard recovery if saving the previous lookup fails", () => {
    const session = storage(); session.setItem(checkoutSessionKeys.recovery, "keep");
    expect(beginAnotherPurchase({ ...session, setItem: () => { throw Error("Storage denied"); } }, previous)).toBe(false);
    expect(session.getItem(checkoutSessionKeys.recovery)).toBe("keep");
  });
  it("rejects malformed lookup and corrupt storage, without any network operation", () => {
    const session = storage(); session.setItem(previousPurchaseKey, "{"); expect(readPreviousPurchase(session)).toBeNull();
    expect(beginAnotherPurchase(session, { ...previous, phone: "invalid" })).toBe(false);
  });
});
