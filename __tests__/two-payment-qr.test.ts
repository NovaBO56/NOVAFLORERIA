import { describe, expect, it } from "vitest";
import { readPaymentQrSelection, savePaymentQrSelection, selectedPaymentQr, type PaymentQr } from "@/lib/public/payment-qrs";
import { reportQrSelectionSchema, patchPaymentQrSchema } from "@/validations/payments";
import { paymentNotice } from "@/lib/public/payment-notice";
import type { PublicOrder } from "@/lib/public/types";
const first: PaymentQr = { qr_slot: "qr_1", account_label: "Cuenta prueba A", qr_public_url: "/qr-a.png" };
const second: PaymentQr = { qr_slot: "qr_2", account_label: "Cuenta prueba B", qr_public_url: "/qr-b.png" };
describe("Selección de QR", () => {
  it("cero no selecciona; uno selecciona el único activo; dos exigen elección", () => {
    expect(selectedPaymentQr([])).toBeNull(); expect(selectedPaymentQr([first])).toEqual(first); expect(selectedPaymentQr([second], "qr_1")).toEqual(second);
    expect(selectedPaymentQr([first, second])).toBeNull(); expect(selectedPaymentQr([first, second], "qr_2")).toEqual(second);
  });
  it("recarga recupera la elección solo para el mismo pedido y sin secretos", () => {
    const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => { values.set(key, value); } };
    savePaymentQrSelection(storage, "pedido-local", "qr_2"); expect(readPaymentQrSelection(storage, "pedido-local")).toBe("qr_2"); expect(readPaymentQrSelection(storage, "otro-pedido")).toBeNull();
    expect([...values.values()]).toEqual(['{"order_id":"pedido-local","qr_slot":"qr_2"}']);
  });
  it("valida slot y no acepta snapshot/confirmación enviado por cliente", () => {
    expect(reportQrSelectionSchema.safeParse({ qr_slot: "otro" }).success).toBe(false);
    expect(reportQrSelectionSchema.parse({ qr_slot: "qr_2", qr_label: "Falso", status: "confirmado" })).toEqual({ qr_slot: "qr_2" });
    expect(patchPaymentQrSchema.safeParse({ qr_slot: "qr_2", account_label: " " }).success).toBe(false);
    expect(patchPaymentQrSchema.safeParse({ qr_slot: "qr_2", is_active: false }).success).toBe(true);
  });
  it("WhatsApp incluye etiqueta del snapshot e indica revisión manual", () => {
    const order = { order_number: 12, total: 20, items: [], reported_qr: second } as unknown as PublicOrder;
    expect(paymentNotice(order, "Cliente Prueba", "70000000")).toContain("Pago reportado mediante: Cuenta prueba B");
    expect(paymentNotice(order, "Cliente Prueba", "70000000")).toContain("pendiente de revisión");
    expect(paymentNotice(order, "Cliente Prueba", "70000000", "Snapshot servidor")).toContain("Pago reportado mediante: Snapshot servidor");
  });
});
