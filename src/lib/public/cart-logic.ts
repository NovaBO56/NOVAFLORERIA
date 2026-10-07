import { formatMoney } from "./format";

/* ============================================================
   Lógica pura del carrito (sin React ni localStorage).
   ============================================================ */

export const MAX_QUANTITY = 99;
export const MAX_ITEMS = 50;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  /** false si el producto se agotó o dejó de existir. */
  available: boolean;
};

export type CartProductInput = {
  id: string;
  name: string;
  price: number | string;
  image: string | null;
};

function clampQuantity(value: number) {
  return Math.min(MAX_QUANTITY, Math.max(0, Math.floor(value)));
}

/**
 * Lo que viene de localStorage no es de fiar (otra versión, editado a
 * mano, dañado): se valida cada campo y se descarta lo que no sirve.
 */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  const items: CartItem[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const item = entry as Record<string, unknown>;
    const price = Number(item.price);
    const quantity = clampQuantity(Number(item.quantity));

    if (
      typeof item.id !== "string" ||
      item.id.length === 0 ||
      typeof item.name !== "string" ||
      !Number.isFinite(price) ||
      price < 0 ||
      quantity < 1 ||
      seen.has(item.id)
    ) {
      continue;
    }

    seen.add(item.id);
    items.push({
      id: item.id,
      name: item.name.slice(0, 200),
      price,
      image: typeof item.image === "string" ? item.image : null,
      quantity,
      available: item.available !== false,
    });

    if (items.length >= MAX_ITEMS) break;
  }

  return items;
}

export function addItem(
  items: CartItem[],
  product: CartProductInput,
  quantity = 1,
): CartItem[] {
  const amount = clampQuantity(quantity);

  if (amount < 1) return items;

  const existing = items.find((item) => item.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.id === product.id
        ? { ...item, quantity: clampQuantity(item.quantity + amount) }
        : item,
    );
  }

  if (items.length >= MAX_ITEMS) return items;

  return [
    ...items,
    {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      quantity: amount,
      available: true,
    },
  ];
}

/** Suma o resta; al llegar a 0 el producto sale del carrito. */
export function changeItemQuantity(
  items: CartItem[],
  id: string,
  delta: number,
): CartItem[] {
  return items
    .map((item) =>
      item.id === id
        ? { ...item, quantity: clampQuantity(item.quantity + delta) }
        : item,
    )
    .filter((item) => item.quantity > 0);
}

export function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((item) => item.id !== id);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function hasUnavailable(items: CartItem[]) {
  return items.some((item) => !item.available);
}

/** Mensaje de WhatsApp con el resumen del carrito. */
export function buildOrderMessage(items: CartItem[]) {
  const lines = items.map(
    (item) =>
      `• ${item.quantity} × ${item.name} (${formatMoney(item.price)} c/u)`,
  );

  return [
    "Hola NOVA Florería, quiero hacer este pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatMoney(cartTotal(items))}`,
  ].join("\n");
}