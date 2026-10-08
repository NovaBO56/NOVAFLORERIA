import { z } from "zod";
import { createOrderSchema } from "@/validations/orders";
import type { CartItem } from "./cart-logic";

export const checkoutDetailsSchema = z.object({
  customer_name: createOrderSchema.shape.customer_name,
  customer_phone: createOrderSchema.shape.customer_phone,
  delivery: z.enum(["retiro", "entrega"]),
  address: z.string().trim().max(400),
  reference: z.string().trim().max(150, "La referencia puede tener hasta 150 caracteres.").optional(),
  notes: z.string().trim().max(400),
  promotion_id: z.string().uuid().or(z.literal("")),
}).refine(data => data.delivery !== "entrega" || data.address.length >= 5, { path: ["address"], message: "Indica una dirección y referencia para coordinar la entrega." });
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

export function orderPayload(items: CartItem[], details: CheckoutDetails, key: string) {
  const data = checkoutDetailsSchema.parse(details);
  if (items.some(item => !item.available)) throw new Error("Retira los productos no disponibles del carrito.");
  return createOrderSchema.parse({
    customer_name: data.customer_name, customer_phone: data.customer_phone,
    customer_message: [`Método: ${data.delivery === "retiro" ? "Retiro en tienda" : "Entrega por coordinar"}`, data.delivery === "entrega" ? data.address : "", data.delivery === "entrega" && data.reference ? `Referencia: ${data.reference}` : "", data.notes].filter(Boolean).join("\n"),
    promotion_id: data.promotion_id || null, idempotency_key: key,
    items: items.map(item => ({ product_id: item.id.split(":")[0], quantity: item.quantity, customization_option_ids: item.options?.map(option => option.id) ?? [], message: item.message || null })),
  });
}

export async function publicRequest<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "No se pudo completar la solicitud. Intenta nuevamente.");
  return data as T;
}

// A synchronous guard also blocks repeated clicks before React renders loading.
export function singleFlight() {
  let busy = false;
  return async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    if (busy) return undefined;
    busy = true;
    try { return await action(); } finally { busy = false; }
  };
}

export function requiresPayment(order: Pick<import("./types").PublicOrder, "status" | "total">): boolean {
  return order.status === "pendiente_pago" && Number(order.total) > 0;
}

export function reachedConfirmation(order: Pick<import("./types").PublicOrder, "status" | "total" | "payment_status">): boolean {
  return Boolean(order.payment_status) || Number(order.total) === 0 || ["confirmado", "en_preparacion", "listo", "finalizado"].includes(order.status);
}
export function checkoutStep(order: Parameters<typeof reachedConfirmation>[0] | null, recovery: boolean, review: boolean, confirmedBefore = false) {
  return confirmedBefore || (order && reachedConfirmation(order)) ? 3 : recovery ? 2 : review ? 1 : 0;
}

export const checkoutSessionKeys = { recovery: "nova-checkout-order-v1", attempt: "nova-checkout-attempt-v1", draft: "nova-checkout-draft-v1" } as const;
// Drafts may be incomplete. Keep only bounded form fields, never an order/token/cart copy.
const draftSchema = z.object({ customer_name: z.string().max(200), customer_phone: z.string().max(8), delivery: z.enum(["retiro", "entrega"]), address: z.string().max(400), reference: z.string().max(400).optional(), notes: z.string().max(400), promotion_id: z.string().uuid().or(z.literal("")) });
export function readCheckoutDraft(storage: Pick<Storage, "getItem">): CheckoutDetails | null {
  try { const result = draftSchema.safeParse(JSON.parse(storage.getItem(checkoutSessionKeys.draft) || "null")); return result.success ? result.data : null; } catch { return null; }
}
export function saveCheckoutDraft(storage: Pick<Storage, "setItem">, details: CheckoutDetails) {
  try { storage.setItem(checkoutSessionKeys.draft, JSON.stringify(draftSchema.parse(details))); } catch { /* Session storage is optional. */ }
}
export function clearCheckoutSession(storage: Pick<Storage, "removeItem">) {
  for (const key of Object.values(checkoutSessionKeys)) { try { storage.removeItem(key); } catch { /* In-memory state is cleared by caller. */ } }
}

export const orderStatusLabels: Record<string, string> = { pendiente_pago: "Pendiente de pago", confirmado: "Pedido confirmado", en_preparacion: "En preparación", listo: "Listo para entregar", finalizado: "Pedido finalizado", cancelado: "Cancelado", rechazado: "Pedido rechazado; contacta a la tienda" };
export const paymentStatusLabels: Record<string, string> = { pendiente: "Reportado, pendiente de revisión", confirmado: "Confirmado", rechazado: "Rechazado; contacta a la tienda", reembolsado: "Reembolsado" };
