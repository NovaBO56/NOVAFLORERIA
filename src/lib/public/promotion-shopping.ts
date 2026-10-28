import { MAX_QUANTITY, type CartItem } from "./cart-logic";
import { cartPromotion } from "./cart-promotions";
import { formatMoney, isPurchasable } from "./format";
import type { PublicPromotion } from "./types";

export function promotionIsCurrent(promotion: PublicPromotion, now = Date.now()) {
  return (!promotion.starts_at || Date.parse(promotion.starts_at) <= now) && (!promotion.ends_at || Date.parse(promotion.ends_at) >= now);
}

export function canBuildCombo(promotion: PublicPromotion) {
  return promotion.promotion_type === "combo" && Boolean(promotion.products?.length) &&
    Number.isFinite(promotion.combo_price) && Number(promotion.combo_price) > 0 &&
    Number(promotion.combo_price) < promotion.products!.reduce((sum, line) => sum + line.unit_price * line.quantity, 0) &&
    promotion.products!.every(line => line.product && isPurchasable(line.product) && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= MAX_QUANTITY);
}

export function promotionProgress(promotion: PublicPromotion, items: CartItem[], now = Date.now()) {
  if (!promotionIsCurrent(promotion, now)) return "Esta promoción ya no está disponible. Puedes elegir otra o continuar sin descuento.";
  if (!promotion.products?.length) return "Por ahora esta promoción no está disponible. Puedes elegir otra o continuar sin descuento.";
  if (items.some(item => !item.available)) return "Ajusta los productos no disponibles para consultar tu descuento.";
  const missing = promotion.promotion_type === "combo" ? promotion.products.flatMap(line => {
    const quantity = items.filter(item => item.id.split(":")[0] === line.product_id).reduce((sum, item) => sum + item.quantity, 0);
    return quantity < line.quantity ? [`${line.quantity - quantity} × ${line.product?.name ?? "producto participante"}`] : [];
  }) : [];
  if (missing.length) return `Completa el combo: ${missing.join(", ")}. El beneficio aún no se aplica.`;
  const matches = items.some(item => promotion.products!.some(line => line.product_id === item.id.split(":")[0]));
  if (!matches) return "Esta promoción no incluye los productos de tu carrito. Añade un producto participante o continúa sin descuento.";
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  if (subtotal < Number(promotion.minimum_purchase ?? 0)) return `Faltan ${formatMoney(Number(promotion.minimum_purchase) - subtotal)} para la compra mínima. El beneficio aún no se aplica.`;
  return cartPromotion(promotion, items, now) ? null : "Esta promoción ya no aplica a los productos seleccionados. Puedes elegir otra o continuar sin descuento.";
}

export function promotionPricePreview(promotion: PublicPromotion) {
  const components = promotion.products;
  if (!components?.length) return null;
  if (promotion.promotion_type !== "combo" && components.length !== 1) return null;
  const items: CartItem[] = components.map(line => ({ id: line.product_id, name: line.product?.name ?? "", price: line.unit_price, quantity: promotion.promotion_type === "combo" ? line.quantity : 1, image: null, available: true }));
  const applied = cartPromotion(promotion, items);
  return applied ? { before: items.reduce((sum, item) => sum + item.price * item.quantity, 0), after: applied.total } : null;
}
