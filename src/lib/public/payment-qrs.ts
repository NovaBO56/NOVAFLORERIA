export type QrSlot = "qr_1" | "qr_2";
export type PaymentQr = { qr_slot: QrSlot; qr_public_url: string; account_label: string };
export const qrSlots: QrSlot[] = ["qr_1", "qr_2"];
export const qrSlotLabel = (slot: QrSlot) => slot === "qr_1" ? "QR 1" : "QR 2";

export function selectedPaymentQr(qrs: PaymentQr[], slot?: QrSlot | null): PaymentQr | null {
  return qrs.find(qr => qr.qr_slot === slot) ?? (qrs.length === 1 ? qrs[0] : null);
}

/** Session-only selection, scoped to one order. Never persist bank evidence/tokens. */
export const paymentQrSessionKey = "nova-checkout-qr-v1";
export function readPaymentQrSelection(storage: Pick<Storage, "getItem">, orderId: string): QrSlot | null {
  try {
    const saved = JSON.parse(storage.getItem(paymentQrSessionKey) || "null");
    return saved?.order_id === orderId && qrSlots.includes(saved.qr_slot) ? saved.qr_slot : null;
  } catch { return null; }
}
export function savePaymentQrSelection(storage: Pick<Storage, "setItem">, orderId: string, slot: QrSlot) {
  try { storage.setItem(paymentQrSessionKey, JSON.stringify({ order_id: orderId, qr_slot: slot })); } catch { /* Optional session storage. */ }
}
