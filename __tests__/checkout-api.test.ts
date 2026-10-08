import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), adminRpc: vi.fn(), adminFactory: vi.fn(), allowed: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.adminFactory }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.allowed, rateLimitResponse: () => new Response(JSON.stringify({ success: false }), { status: 429 }) }));
import { POST as create } from "@/app/api/orders/route";
import { POST as track } from "@/app/api/orders/track/route";
import { POST as pay } from "@/app/api/orders/[id]/payment/route";
const id = "550e8400-e29b-41d4-a716-446655440000";
const request = (body: unknown) => new Request("http://localhost/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const payload = { customer_name: "Ana", customer_phone: "70000000", idempotency_key: "same-key", items: [{ product_id: id, quantity: 1 }] };
beforeEach(() => { vi.resetAllMocks(); mocks.allowed.mockResolvedValue(true); mocks.adminFactory.mockReturnValue({ rpc: mocks.adminRpc }); });
describe("Integración HTTP del checkout con RPC existentes", () => {
  it("rechaza pedido vacío antes de llamar create_order", async () => {
    expect((await create(request({ ...payload, items: [] }))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("pasa la clave de idempotencia y retorna el UUID real", async () => {
    mocks.adminRpc.mockResolvedValue({ data: id, error: null });
    const response = await create(request(payload)); expect(response.status).toBe(201); expect(await response.json()).toEqual({ success: true, order_id: id });
    expect(mocks.adminRpc).toHaveBeenCalledWith("create_order", expect.objectContaining({ p_idempotency_key: "same-key", p_customer_phone: "70000000", p_items: [{ product_id: id, quantity: 1, customization_option_ids: [] }] }));
  });
  it("devuelve un error de stock comprensible", async () => {
    mocks.adminRpc.mockResolvedValue({ error: { code: "P0001", message: "Stock insuficiente" }, data: null });
    const response = await create(request(payload)); expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ message: "Stock insuficiente" });
  });
  it("limita consultas públicas y no consulta datos si supera el límite", async () => {
    mocks.allowed.mockResolvedValue(false); expect((await track(request({ order_number: 1, customer_phone: "70000000" }))).status).toBe(429); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("consulta el resumen protegido por número y teléfono", async () => {
    const order = { order_number: 1, status: "confirmado", payment_status: "confirmado" }; mocks.rpc.mockResolvedValue({ data: order, error: null });
    const response = await track(request({ order_number: 1, customer_phone: "70000000" })); expect(await response.json()).toEqual({ success: true, order });
    expect(mocks.rpc).toHaveBeenCalledWith("track_order_details", { p_order_number: 1, p_order_id: null, p_customer_phone: "70000000" });
  });
  it("no registra pago para un teléfono que no coincide", async () => {
    mocks.adminRpc.mockResolvedValue({ error: { code: "P0002" }, data: null });
    expect((await pay(request({ customer_phone: "70000001" }), { params: Promise.resolve({ id }) })).status).toBe(404);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.adminRpc).toHaveBeenCalledWith("create_payment", { p_order_id: id, p_customer_phone: "70000001" });
  });
  it("registra el pago pendiente sin marcarlo como confirmado", async () => {
    mocks.adminRpc.mockResolvedValue({ data: [{ id, order_number: 1, amount: 100, status: "pendiente" }], error: null });
    const response = await pay(request({ customer_phone: "70000000" }), { params: Promise.resolve({ id }) });
    expect(await response.json()).toMatchObject({ success: true, payment: { status: "pendiente" } });
    expect(mocks.adminRpc).toHaveBeenLastCalledWith("create_payment", { p_order_id: id, p_customer_phone: "70000000" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rechaza pago sin teléfono antes del RPC", async () => {
    expect((await pay(request({}), { params: Promise.resolve({ id }) })).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.adminFactory).not.toHaveBeenCalled();
  });
  it("no crea cliente privilegiado cuando excede el límite", async () => {
    mocks.allowed.mockResolvedValue(false);
    expect((await pay(request({ customer_phone: "70000000" }), { params: Promise.resolve({ id }) })).status).toBe(429);
    expect(mocks.adminFactory).not.toHaveBeenCalled();
  });
  it("reintentos HTTP devuelven el mismo pago que entrega el RPC (mock, no prueba SQL)", async () => {
    mocks.adminRpc.mockResolvedValue({ data: [{ id, amount: 100, status: "pendiente" }], error: null });
    const first = await pay(request({ customer_phone: "70000000" }), { params: Promise.resolve({ id }) });
    const second = await pay(request({ customer_phone: "70000000" }), { params: Promise.resolve({ id }) });
    expect(await first.json()).toEqual(await second.json());
    expect(mocks.adminRpc).toHaveBeenCalledTimes(2);
  });
  it("ignora monto y pedido ajeno adicionales enviados por el cliente", async () => {
    mocks.adminRpc.mockResolvedValue({ data: [{ id, amount: 100, status: "pendiente" }], error: null });
    await pay(request({ customer_phone: "70000000", p_order_id: "otro", amount: 0.01 }), { params: Promise.resolve({ id }) });
    expect(mocks.adminRpc).toHaveBeenCalledWith("create_payment", { p_order_id: id, p_customer_phone: "70000000" });
  });
  it("rechazo de estado/reserva del RPC se presenta como 400", async () => {
    mocks.adminRpc.mockResolvedValue({ error: { code: "P0001", message: "La reserva del pedido venció." }, data: null });
    const response = await pay(request({ customer_phone: "70000000" }), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, message: "La reserva del pedido venció." });
  });
});
