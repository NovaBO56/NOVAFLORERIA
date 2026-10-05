    /**
 * Regla del descuento por MONTO FIJO en promociones de producto.
 *
 * El monto fijo se descuenta una sola vez sobre los productos de la
 * promoción que están en el pedido. Si el monto es mayor que el precio
 * de alguno de esos productos, el cliente se lleva ese producto gratis
 * (o con descuento mayor a su valor), así que no se permite:
 *
 *   monto fijo <= precio del producto MÁS BARATO de la promoción
 *
 * Funciones puras: las usan la pantalla, las rutas del API y los tests.
 */

export type PricedProduct = {
  name: string;
  price: number;
};

/** Compara en centavos para evitar errores de coma flotante. */
function toCents(value: number) {
  return Math.round(Number(value) * 100);
}

function formatMoney(value: number) {
  return `Bs ${Number(value).toFixed(2)}`;
}

/** Producto más barato de la lista, o null si no hay productos. */
export function findCheapestProduct(
  products: PricedProduct[],
): PricedProduct | null {
  let cheapest: PricedProduct | null = null;

  for (const product of products) {
    if (cheapest === null || toCents(product.price) < toCents(cheapest.price)) {
      cheapest = product;
    }
  }

  return cheapest;
}

/**
 * Devuelve el producto más barato cuyo precio es MENOR que el descuento,
 * o null si el descuento es válido para todos los productos.
 */
export function findFixedDiscountViolation(
  discountValue: number,
  products: PricedProduct[],
): PricedProduct | null {
  const cheapest = findCheapestProduct(products);

  if (cheapest === null) return null;

  return toCents(cheapest.price) < toCents(discountValue) ? cheapest : null;
}

export function fixedDiscountMessage(
  discountValue: number,
  product: PricedProduct,
) {
  return `El descuento de ${formatMoney(discountValue)} supera el precio de «${product.name}» (${formatMoney(product.price)}). Reduce el monto a ${formatMoney(product.price)} o quita ese producto.`;
}