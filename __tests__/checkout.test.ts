import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutDetailsSchema, orderPayload, publicRequest, singleFlight } from "@/lib/public/checkout";
import { addItem, sanitizeCart } from "@/lib/public/cart-logic";
import { trackOrderSchema } from "@/validations/public-catalog";
const productId = "550e8400-e29b-41d4-a716-446655440000";
const optionId = "550e8400-e29b-41d4-a716-446655440001";
const details = { customer_name: " Ana ", customer_phone: "70000000", delivery: "retiro" as const, address: "", notes: "Para mañana", promotion_id: "" };
const product = { id: productId, name: "Rosas", price: 100, image: null };
afterEach(() => vi.unstubAllGlobals());
describe("Checkout público", () => {
  it("requiere nombre, teléfono y dirección para entrega", () => {
    expect(checkoutDetailsSchema.safeParse({ ...details, customer_name: " " }).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...details, customer_phone: "12" }).success).toBe(false);
    expect(checkoutDetailsSchema.safeParse({ ...details, delivery: "entrega" }).success).toBe(false);
  });
  it("rechaza carrito vacío o no disponible", () => {
    expect(() => orderPayload([], details, "key")).toThrow();
    expect(() => orderPayload(addItem([], product).map(item => ({ ...item, available: false })), details, "key")).toThrow();
  });
  it("envía ids y tarjeta sin confiar en precios del navegador", () => {
    const cart = addItem([], { ...product, options: [{ id: optionId, name: "Cinta", extra_price: 20 }], message: "Felicidades" }, 2);
    const payload = orderPayload(cart, details, "retry-key");
    expect(payload.customer_name).toBe("Ana");
    expect(payload.items[0]).toEqual({ product_id: productId, quantity: 2, customization_option_ids: [optionId], message: "Felicidades" });
    expect(payload.idempotency_key).toBe("retry-key");
    expect(payload.customer_message).toContain("Retiro en tienda");
    expect(payload.items[0]).not.toHaveProperty("price");
  });
  it("conserva líneas de personalizaciones diferentes al persistir", () => {
    let cart = addItem([], product);
    cart = addItem(cart, { ...product, options: [{ id: optionId, name: "Cinta", extra_price: 20 }] });
    cart = addItem(cart, { ...product, options: [{ id: optionId, name: "Cinta", extra_price: 20 }] });
    expect(cart).toHaveLength(2);
    expect(cart[1].quantity).toBe(2);
    expect(sanitizeCart(JSON.parse(JSON.stringify(cart)))).toEqual(cart);
    expect(sanitizeCart([{ ...cart[0], quantity: "no es número" }])).toEqual([]);
  });
  it("bloquea doble envío y libera el bloqueo después de fallar", async () => {
    const run = singleFlight(); let release!: () => void;
    const action = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
    const first = run(action); await run(action); expect(action).toHaveBeenCalledTimes(1); release(); await first;
    await expect(run(async () => { throw new Error("sin red"); })).rejects.toThrow("sin red");
    expect(await run(async () => "ok")).toBe("ok");
  });
  it("crea pedido usando la API real y transmite la clave para reintento", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, order_id: productId }), { status: 201 })); vi.stubGlobal("fetch", fetcher);
    const payload = orderPayload(addItem([], product), details, "same-key");
    expect(await publicRequest("/api/orders", payload)).toEqual({ success: true, order_id: productId });
    expect(JSON.parse(fetcher.mock.calls[0][1].body).idempotency_key).toBe("same-key");
  });
  it("propaga error de backend y no modifica el carrito", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, message: "Stock insuficiente" }), { status: 400 })));
    const cart = addItem([], product); const before = JSON.stringify(cart);
    await expect(publicRequest("/api/orders", orderPayload(cart, details, "key"))).rejects.toThrow("Stock insuficiente");
    expect(JSON.stringify(cart)).toBe(before);
  });
  it("maneja QR ausente y permite registrar pago pendiente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: "Sin QR" }), { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, payment: { status: "pendiente", amount: 100, order_number: 1 } }))));
    await expect(publicRequest("/api/payment-qr")).rejects.toThrow("Sin QR");
    expect(await publicRequest(`/api/orders/${productId}/payment`, { customer_phone: details.customer_phone })).toMatchObject({ payment: { status: "pendiente" } });
  });
  it("valida seguimiento por número o recuperación por UUID con teléfono", () => {
    expect(trackOrderSchema.safeParse({ order_number: 1, customer_phone: details.customer_phone }).success).toBe(true);
    expect(trackOrderSchema.safeParse({ order_id: productId, customer_phone: details.customer_phone }).success).toBe(true);
    expect(trackOrderSchema.safeParse({ customer_phone: details.customer_phone }).success).toBe(false);
    expect(trackOrderSchema.safeParse({ order_number: -1, customer_phone: details.customer_phone }).success).toBe(false);
  });
});
