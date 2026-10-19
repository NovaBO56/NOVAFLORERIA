import { describe, expect, it } from "vitest";
import { cartPromotion } from "@/lib/public/cart-promotions";
import type { PublicPromotion } from "@/lib/public/types";
import type { CartItem } from "@/lib/public/cart-logic";

const rose: CartItem = { id: "rose", name: "Rosas TEST", price: 100, quantity: 1, image: null, available: true };
const bear: CartItem = { ...rose, id: "bear", name: "Regalo TEST", price: 50 };
const promo: PublicPromotion = { id: "promo", name: "TEST", description: null, promotion_type: "producto", discount_type: "porcentaje", discount_value: 10, combo_price: null, starts_at: null, ends_at: null, minimum_purchase: null, products: [{ product_id: "rose", quantity: 1, unit_price: 100 }] };
describe("Promociones correspondientes al carrito; estimación, no autoridad financiera", () => {
  it("compatible applies only to eligible lines in a mixed cart", () => expect(cartPromotion(promo, [rose, bear])).toMatchObject({ discount: 10, total: 140 }));
  it("incompatible product has no discount", () => expect(cartPromotion(promo, [bear])).toBeNull());
  it("missing product associations never become a global promotion", () => expect(cartPromotion({ ...promo, products: undefined }, [rose])).toBeNull());
  it("empty promotion never becomes global", () => expect(cartPromotion({ ...promo, products: [] }, [rose])).toBeNull());
  it("supports several explicitly associated products, not invented category/global rules", () => expect(cartPromotion({ ...promo, products: [...promo.products!, { product_id: "bear", quantity: 1, unit_price: 50 }] }, [rose, bear])).toMatchObject({ discount: 15, total: 135 }));
  it("quantity changes recalculate eligibility", () => { const minimum = { ...promo, minimum_purchase: 200 }; expect(cartPromotion(minimum, [rose])).toBeNull(); expect(cartPromotion(minimum, [{ ...rose, quantity: 2 }])).toMatchObject({ discount: 20, total: 180 }); });
  it("minimum uses whole order subtotal as SQL does", () => expect(cartPromotion({ ...promo, minimum_purchase: 150 }, [rose, bear])).toMatchObject({ discount: 10 }));
  it("expired is not offered", () => expect(cartPromotion({ ...promo, ends_at: "2026-01-01" }, [rose], Date.parse("2026-02-01"))).toBeNull());
  it("future is not offered", () => expect(cartPromotion({ ...promo, starts_at: "2026-03-01" }, [rose], Date.parse("2026-02-01"))).toBeNull());
  it("invalid date fails closed", () => expect(cartPromotion({ ...promo, ends_at: "invalid" }, [rose])).toBeNull());
  it("100 percent remains a valid free order", () => expect(cartPromotion({ ...promo, discount_value: 100 }, [rose])).toMatchObject({ discount: 100, total: 0 }));
  it("does not offer percentages over 100", () => expect(cartPromotion({ ...promo, discount_value: 101 }, [rose])).toBeNull());
  it("fixed amount applies once and cannot exceed a matching base price", () => { expect(cartPromotion({ ...promo, discount_type: "monto_fijo", discount_value: 20 }, [{ ...rose, quantity: 2 }])).toMatchObject({ discount: 20, total: 180 }); expect(cartPromotion({ ...promo, discount_type: "monto_fijo", discount_value: 101 }, [rose])).toBeNull(); });
  it("customized rows share product eligibility but preserve option prices", () => expect(cartPromotion(promo, [{ ...rose, id: 'rose:["option"]', price: 120 }, rose])).toMatchObject({ discount: 22, total: 198 }));
  it("combo requires every component and quantity, aggregating configured lines", () => { const combo = { ...promo, promotion_type: "combo" as const, combo_price: 200, products: [{ product_id: "rose", quantity: 2, unit_price: 100 }, { product_id: "bear", quantity: 1, unit_price: 50 }] }; expect(cartPromotion(combo, [rose, bear])).toBeNull(); expect(cartPromotion(combo, [rose, { ...rose, id: "rose:option" }, bear])).toMatchObject({ discount: 50, total: 200 }); expect(cartPromotion(combo, [{ ...rose, quantity: 4 }, { ...bear, quantity: 2 }])).toMatchObject({ discount: 100, total: 400 }); });
  it("no-benefit combo and unavailable products are not offered", () => { expect(cartPromotion({ ...promo, promotion_type: "combo", combo_price: 200 }, [rose])).toBeNull(); expect(cartPromotion(promo, [{ ...rose, available: false }])).toBeNull(); });
});
