import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mock.rpc, from: mock.from }) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true, rateLimitResponse: vi.fn() }));
import { POST } from "@/app/api/orders/track/route";
const request = () => new Request("http://localhost/api/orders/track", { method: "POST", body: JSON.stringify({ order_number: 16, customer_phone: "70000000" }) });
beforeEach(() => { vi.resetAllMocks(); mock.from.mockReturnValue({ select: mock.select }); mock.select.mockReturnValue({ eq: mock.eq }); mock.eq.mockReturnValue({ maybeSingle: mock.single }); });
it.each(["proposed", "confirmed", "pending"])("returns the %s schedule only for the authenticated order", async status => {
  mock.rpc.mockResolvedValue({ data: { id: "verified-order", order_number: 16 }, error: null });
  const schedule = { scheduled_for: status === "pending" ? null : "2026-10-25T20:30:00Z", schedule_status: status };
  mock.single.mockResolvedValue({ data: schedule, error: null });
  const response = await POST(request());
  expect(response.status).toBe(200); expect((await response.json()).order).toMatchObject(schedule);
  expect(mock.eq).toHaveBeenCalledWith("id", "verified-order");
  expect(mock.select).toHaveBeenCalledWith("scheduled_for, schedule_status");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("never reads schedules when number and phone do not match", async () => {
  mock.rpc.mockResolvedValue({ data: null, error: { code: "P0001" } });
  expect((await POST(request())).status).toBe(404); expect(mock.from).not.toHaveBeenCalled();
});
it("does not turn a failed schedule query into an apparent unassigned time", async () => {
  mock.rpc.mockResolvedValue({ data: { id: "verified-order" }, error: null });
  mock.single.mockResolvedValue({ data: null, error: { message: "private detail" } });
  const response = await POST(request()); expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("private detail");
});
