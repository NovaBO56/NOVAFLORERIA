import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromotionChooser } from "@/components/public/promotion-chooser";
import { CheckoutForm } from "@/components/public/checkout-form";
import { cartPromotion } from "@/lib/public/cart-promotions";
import { removeItem, type CartItem } from "@/lib/public/cart-logic";
import type { PublicPromotion } from "@/lib/public/types";

vi.mock("@/components/public/home/shared", () => ({ script: { className: "script" }, lato: { className: "lato" } }));
vi.mock("@/components/public/safe-image", () => ({
  SafeImage: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }),
}));

const now = Date.parse("2026-10-26T12:00:00Z");
const rose: CartItem = { id: "rose", name: "Ramo de rosas", price: 100, quantity: 1, image: "/rose.jpg", available: true };
const bear: CartItem = { ...rose, id: "bear", name: "Oso de peluche", price: 50, image: null };
const offer: PublicPromotion = { id: "offer", name: "Rosas para ti", description: null, promotion_type: "producto", discount_type: "porcentaje", discount_value: 10, combo_price: null, minimum_purchase: null, starts_at: null, ends_at: null, products: [{ product_id: "rose", quantity: 1, unit_price: 100 }] };
const combo: PublicPromotion = { ...offer, id: "combo", name: "Rosas y un abrazo", promotion_type: "combo", combo_price: 120, products: [...offer.products!, { product_id: "bear", quantity: 1, unit_price: 50 }] };
const render = (promotions: PublicPromotion[], items: CartItem[], selectedId: string) => renderToStaticMarkup(createElement(PromotionChooser, { promotions, items, selectedId, now, onSelect: () => {} }));

function buttonAction(node: ReactNode, label: string): (() => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) { const action = buttonAction(child, label); if (action) return action; }
  } else if (isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) {
    if (node.type === "button" && node.props.children === label) return node.props.onClick;
    return buttonAction(node.props.children, label);
  }
}

describe("Optional promotion UX (unit/markup; not browser evidence)", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
  it("shows the selected benefit, condition and removal without treating an estimate as a final price", () => {
    const html = render([offer], [rose], offer.id);
    expect(html).toContain('data-promotion-state="selected"');
    for (const text of ["Promoción seleccionada", "Beneficio esperado", "Descuento estimado: −Bs 10.00", "Condición:", "Quitar promoción", "Tu descuento se confirmará antes de finalizar"]) expect(html).toContain(text);
  });
  it("a required combo item removed from the cart makes the offer visibly inactive", () => {
    expect(cartPromotion(combo, [rose, bear], now)?.discount).toBe(30);
    const items = removeItem([rose, bear], bear.id);
    const html = render([combo], items, combo.id);
    expect(html).toContain('data-promotion-state="invalid"');
    expect(html).toContain("Promoción no aplicada");
    expect(html).toContain("Completa el combo");
    expect(html).toContain("Continuar sin descuento");
    expect(html).not.toContain("Promoción seleccionada");
    expect(html).not.toContain("Descuento estimado:");
    expect(cartPromotion(combo, items, now)).toBeNull();
  });
  it("minimum, expiry and nonmatching products never appear as active selections", () => {
    for (const [promotion, items] of [
      [{ ...offer, minimum_purchase: 200 }, [rose]],
      [{ ...offer, ends_at: "2026-10-25T00:00:00Z" }, [rose]],
      [offer, [bear]],
    ] as [PublicPromotion, CartItem[]][]) {
      const html = render([promotion], items, promotion.id);
      expect(html).toContain('data-promotion-state="invalid"');
      expect(html).not.toContain('data-promotion-state="selected"');
      expect(html).not.toContain("Descuento estimado:");
    }
  });
  it("unknown or malformed offer dates are explained without crashing the customer UI", () => {
    expect(render([], [rose], "missing")).toContain("Promoción ya no disponible");
    expect(render([{ ...offer, ends_at: "not-a-date" }], [rose], offer.id)).toContain("Promoción no aplicada");
  });
  it("removal persists an explicit empty intent and coming back to eligible items only suggests it", async () => {
    const stored = new Map<string, string>();
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) }, addEventListener: () => {}, removeEventListener: () => {} });
    const { selectPromotion, getPromotionSelection } = await import("@/lib/public/promotion-selection");
    const id = "a0000000-0000-4000-8000-000000000001";
    const promotion = { ...offer, id };
    selectPromotion(id);
    const tree = PromotionChooser({ promotions: [promotion], items: [rose], selectedId: getPromotionSelection()!, now, onSelect: selectPromotion });
    const remove = buttonAction(tree, "Quitar promoción");
    expect(remove).toBeTypeOf("function");
    remove!();
    expect(getPromotionSelection()).toBe("");
    expect(stored.get("nova-promotion-v1")).toBe('""');
    const html = render([promotion], [rose], getPromotionSelection()!);
    expect(html).toContain('data-promotion-state="suggested"');
    expect(html).not.toContain("Descuento estimado:");
    expect(html).toContain("Elegir esta promoción");
  });
  it("offers only currently applicable alternatives and an explicit change control", () => {
    const html = render([offer, { ...offer, id: "other", name: "Otra promoción", discount_value: 15 }, { ...offer, id: "future", name: "Aún no vigente", starts_at: "2030-01-01" }], [rose], offer.id);
    expect(html).toContain("Cambiar promoción");
    expect(html).toContain("Otra promoción");
    expect(html).not.toContain("Aún no vigente");
  });
  it("checkout exposes an invalid offer and removal from the first step with undiscounted totals", () => {
    const html = renderToStaticMarkup(createElement(CheckoutForm, {
      details: { customer_name: "", customer_phone: "", delivery: "retiro", address: "", reference: "", notes: "", promotion_id: offer.id },
      update: () => {}, items: [bear], total: 50, unavailable: false, busy: false, status: null, promotions: [offer], createOrder: async () => {},
    }));
    expect(html).toContain("Datos de quien compra");
    expect(html).toContain("Promoción no aplicada");
    expect(html).toContain("Continuar sin descuento");
    expect(html).toContain("Bs 50.00");
    expect(html).not.toContain("Descuento estimado:");
    expect(html).toContain("imagen no disponible");
  });
});
