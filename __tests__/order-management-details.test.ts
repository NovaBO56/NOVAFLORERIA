import { describe, expect, it, vi, beforeEach } from "vitest";
import { detailPaymentLabel, historyProjection, orderProgress } from "@/lib/admin/order-detail";
import { orderScheduleSchema, scheduleInstant } from "@/validations/order-schedule";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireEmployeeOrAdmin: mocks.auth }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: mocks.rpc }) }));
import { POST } from "@/app/api/admin/orders/[id]/schedule/route";
const base = { status: "pendiente_pago", order_type: "online", total: 100, customer_message: "Método: Retiro en tienda", cancellation_reason: null, payments: [] };
const id = "550e8400-e29b-41d4-a716-446655440000", context = { params: Promise.resolve({ id }) };
const payload = { date: "2026-12-01", time: "10:30", status: "proposed", client_confirmed: false, revision: 0 };
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ id: "verified" }); mocks.rpc.mockResolvedValue({ data: 1, error: null }); });
describe("Administrative order presentation — pure logic", () => {
  it("does not confirm a reported payment or start preparation", () => {
    const value = orderProgress({ ...base, payments: [{ id, method: "qr", status: "pendiente" }] });
    expect(value.steps.filter(s => s.complete).map(s => s.label)).toEqual(["Pedido registrado", "Pago reportado"]);
    expect(detailPaymentLabel(100, [{ id, method: "qr", status: "pendiente" }])).toContain("pendiente de verificación");
  });
  it("keeps manual confirmation separate from preparation", () => {
    const value = orderProgress({ ...base, status: "confirmado", payments: [{ id, method: "qr", status: "confirmado", confirmed_at: "2026-10-24T14:00:00Z" }] });
    expect(value.steps.find(s => s.label === "Pago confirmado")?.complete).toBe(true);
    expect(value.steps.find(s => s.label === "En preparación")?.complete).toBe(false);
  });
  it("uses pickup/delivery final labels and no invented en-camino state", () => {
    expect(orderProgress({ ...base, status: "listo" }).steps.map(s => s.label)).toContain("Listo para recoger");
    const labels = orderProgress({ ...base, customer_message: "Método: Entrega por coordinar", status: "finalizado" }).steps.map(s => s.label);
    expect(labels).toContain("Listo para coordinar entrega"); expect(labels).toContain("Entregado"); expect(labels.join(" ")).not.toMatch(/camino/i);
  });
  it("does not invent paid steps for free or operational stages for physical sales", () => {
    const free = orderProgress({ ...base, total: 0, status: "confirmado" }); expect(free.steps.map(s => s.label)).not.toContain("Pago reportado"); expect(detailPaymentLabel(0, [])).toBe("No requiere pago");
    const physical = orderProgress({ ...base, order_type: "fisica", status: "finalizado" }); expect(physical.steps).toHaveLength(3); expect(physical.current).toBe(-1);
  });
  it.each(["cancelado", "rechazado"])("does not mark operational stages on %s", status => {
    const value = orderProgress({ ...base, status }); expect(value.stopped).toBe(true); expect(value.current).toBe(-1); expect(value.steps.slice(-3).every(s => !s.complete)).toBe(true);
  });
  it("identifies expiry from the recorded cancellation reason", () => {
    expect(orderProgress({ ...base, status: "cancelado", cancellation_reason: "Reserva de inventario vencida." }).expired).toBe(true);
    expect(orderProgress({ ...base, status: "cancelado" }).expired).toBe(false);
  });
  it("projects audited events without phone, receipt token or full snapshots", () => {
    const event = historyProjection({ id, action: "UPDATE", table_name: "orders", created_at: "2026-10-24T14:00:00Z", user_id: id, before: { status: "confirmado" }, after: { status: "en_preparacion", receipt_token: "private", guest_phone: "private" } }, "Empleado");
    expect(event?.to).toBe("en_preparacion"); expect(JSON.stringify(event)).not.toContain("private");
    expect(historyProjection({ id, action: "UPDATE", table_name: "orders", created_at: "now", user_id: id, before: { status: "confirmado" }, after: { status: "confirmado" } }, null)).toBeNull();
  });
});
describe("Schedule validation and API — mocked Auth/DB, not live HTTP", () => {
  const request = (body: unknown) => new Request("http://localhost", { method: "POST", body: JSON.stringify(body) });
  it("converts Bolivia civil time and rejects invalid calendar/clock input", () => {
    expect(scheduleInstant("2026-12-01", "10:30")).toBe("2026-12-01T14:30:00.000Z");
    for (const invalid of [{ date: "2026-02-30" }, { date: "2026-13-01" }, { time: "24:10" }, { revision: -1 }, { actor: id }]) expect(orderScheduleSchema.safeParse({ ...payload, ...invalid }).success).toBe(false);
  });
  it("requires explicit acknowledgement only for confirmed schedules", () => {
    expect(orderScheduleSchema.safeParse({ ...payload, status: "confirmed" }).success).toBe(false);
    expect(orderScheduleSchema.safeParse({ ...payload, status: "confirmed", client_confirmed: true }).success).toBe(true);
    expect(orderScheduleSchema.safeParse({ ...payload, client_confirmed: true }).success).toBe(false);
  });
  it("denies unauthorized callers before a mutation", async () => {
    mocks.auth.mockRejectedValue(Error()); expect((await POST(request(payload), context)).status).toBe(403); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("malformed JSON is 400 without a mutation", async () => {
    expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }), context)).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("uses the authenticated client and revision, without a spoofable actor", async () => {
    expect((await POST(request(payload), context)).status).toBe(200); expect(mocks.rpc).toHaveBeenCalledWith("set_order_schedule", { p_order: id, p_when: "2026-12-01T14:30:00.000Z", p_status: "proposed", p_revision: 0, p_client_confirmed: false });
  });
  it("returns 409 on a schedule revision conflict", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "40001", message: "El horario cambió." } }); expect((await POST(request(payload), context)).status).toBe(409);
  });
  it("hides unexpected server errors", async () => {
    mocks.rpc.mockRejectedValue(Error("private database details")); const result = await POST(request(payload), context); expect(result.status).toBe(500); expect(JSON.stringify(await result.json())).not.toContain("private database");
  });
});
