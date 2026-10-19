import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ComboProgress } from "@/components/public/combo-progress";
import { ShoppingNotice } from "@/components/public/shopping-notice";
import { addCartBatch, removeItem, changeItemQuantity, type CartItem } from "@/lib/public/cart-logic";
import { cartPromotion } from "@/lib/public/cart-promotions";
import type { PublicProduct, PublicPromotion } from "@/lib/public/types";

vi.mock("@/components/public/safe-image", () => ({ SafeImage: ({ src, alt }: { src: string; alt: string }) => createElement("img", { src, alt }) }));
const rose: PublicProduct = { id: "rose", name: "Ramo sintético", price: 45, category_id: null, occasion: null, season_id: null, is_featured: false, is_available: true, is_sold_out: false, catalog_order: 1, images: [{ id: "image", public_url: "/rose.png", alt_text: "Imagen configurada", sort_order: 0 }] };
const gift = { ...rose, id: "gift", name: "Detalle sintético", price: 95 };
const promotion: PublicPromotion = { id: "combo", name: "Combo configurado", description: null, promotion_type: "combo", discount_type: null, discount_value: null, combo_price: 100, minimum_purchase: null, starts_at: null, ends_at: null, products: [rose, gift].map(p => ({ product_id: p.id, quantity: 1, unit_price: p.price, product: p })) };
const line = (p: PublicProduct): CartItem => ({ id: p.id, name: p.name, price: p.price, quantity: 1, image: null, available: true });

describe("Combo progress and cart messages (unit/markup)", () => {
  it.each([1, 2])("identifies current product and progress at step %i without technical wording", step => {
    const p = step === 1 ? rose : gift;
    const html = renderToStaticMarkup(createElement(ComboProgress, { product: p, step, total: 2, quantity: 1, name: promotion.name, onCancel: vi.fn() }));
    expect(html).toContain(`Paso ${step} de 2`); expect(html).toContain(p.name); expect(html).toContain("/rose.png"); expect(html).toContain(`aria-valuenow="${step}"`); expect(html).toContain("Cancelar armado del combo"); expect(html).not.toContain("Agregaremos el combo completo al terminar");
  });
  it("keeps cancellation and cart removal notifications distinct and accessible", () => {
    const info = renderToStaticMarkup(<ShoppingNotice onDismiss={vi.fn()}>Armado cancelado. Tu carrito se conserva.</ShoppingNotice>);
    const error = renderToStaticMarkup(<ShoppingNotice tone="error">Este producto ya no está disponible.</ShoppingNotice>);
    expect(info).toContain('role="status"'); expect(info).toContain("Cerrar aviso"); expect(info).toContain("rounded-2xl"); expect(error).toContain('role="alert"');
  });
  it("retains both personalized components and recalculates discount after removal and quantity changes", () => {
    const items = addCartBatch([], [{ product: { ...line(rose), price: 50, options: [{ id: "wrap", name: "Envoltura", extra_price: 5 }], message: "Tarjeta uno" }, quantity: 1 }, { product: { ...line(gift), price: 98, options: [{ id: "ribbon", name: "Lazo", extra_price: 3 }], message: "Tarjeta dos" }, quantity: 1 }]);
    expect(cartPromotion(promotion, items)).toMatchObject({ discount: 40, total: 108 }); expect(items.map(item => item.message)).toEqual(["Tarjeta uno", "Tarjeta dos"]);
    expect(cartPromotion(promotion, removeItem(items, items[1].id))).toBeNull();
    expect(cartPromotion(promotion, changeItemQuantity(items, items[0].id, 1))).toMatchObject({ discount: 40, total: 158 });
  });
});
