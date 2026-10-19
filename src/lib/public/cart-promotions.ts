import type { CartItem } from "./cart-logic";
import type { PublicPromotion } from "./types";

const cents = (amount: number) => Math.round(Number(amount) * 100);

/** Display estimate only. create_order/apply_order_discount remain authoritative.
 * Missing associations never mean a global promotion: SQL requires components.
 */
export function cartPromotion(promotion: PublicPromotion, items: CartItem[], now = Date.now()) {
  const components = promotion.products;
  if (!components?.length || !items.length || items.some(item => !item.available)) return null;
  if ((promotion.starts_at && !(Date.parse(promotion.starts_at) <= now)) ||
      (promotion.ends_at && !(Date.parse(promotion.ends_at) >= now))) return null;
  const subtotal = items.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0);
  if (subtotal < cents(promotion.minimum_purchase ?? 0)) return null;
  const eligible = items.filter(item => components.some(component => component.product_id === item.id.split(":")[0]));
  const eligibleSubtotal = eligible.reduce((sum, item) => sum + cents(item.price) * item.quantity, 0);
  if (!eligibleSubtotal) return null;
  let discount = 0;
  if (promotion.promotion_type === "producto") {
    const value = Number(promotion.discount_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    if (promotion.discount_type === "porcentaje") {
      if (value > 100) return null;
      discount = Math.round(eligibleSubtotal * value / 100);
    } else if (promotion.discount_type === "monto_fijo") {
      // The SQL guard compares current base product prices, not option surcharges.
      if (components.some(component => eligible.some(item => item.id.split(":")[0] === component.product_id) && cents(component.unit_price) < cents(value))) return null;
      discount = Math.min(cents(value), eligibleSubtotal);
    } else return null;
  } else if (promotion.promotion_type === "combo") {
    if (promotion.combo_price === null || !Number.isFinite(Number(promotion.combo_price))) return null;
    let sets = Infinity;
    let normal = 0;
    for (const component of components) {
      if (!(component.quantity > 0) || !Number.isFinite(component.unit_price)) return null;
      const quantity = items.filter(item => item.id.split(":")[0] === component.product_id).reduce((sum, item) => sum + item.quantity, 0);
      sets = Math.min(sets, Math.floor(quantity / component.quantity));
      normal += cents(component.unit_price) * component.quantity;
    }
    if (sets < 1 || !Number.isFinite(sets)) return null;
    discount = Math.round(Math.max(0, normal - cents(promotion.combo_price)) * sets);
  } else return null;
  if (!discount) return null;
  discount = Math.min(discount, subtotal);
  return { promotion, discount: discount / 100, total: (subtotal - discount) / 100 };
}
