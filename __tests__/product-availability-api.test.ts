import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), allowed: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.allowed, rateLimitResponse: () => new Response("", { status: 429 }) }));
import { POST } from "@/app/api/products/availability/route";
import { withProductAvailability } from "@/lib/public/product-availability.server";
const id = "550e8400-e29b-41d4-a716-446655440000";
const request = (body: unknown) => new Request("http://localhost/api/products/availability", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mocks.allowed.mockResolvedValue(true); });
describe("Real route/helper with mocked database, not real permission tests", () => {
  it("uses the private server RPC and combines cart demand including options", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ line_index: 0, product_id: id, available_quantity: "0", is_available: false, is_sold_out: true }], error: null });
    const response = await POST(request({ items: [{ product_id: id, quantity: 2, customization_option_ids: [id] }] }));
    expect(response.status).toBe(200);
    expect((await response.json()).availability[0]).toMatchObject({ available_quantity: 0, is_available: false });
    expect(mocks.rpc).toHaveBeenCalledWith("get_product_availability", { p_items: [{ product_id: id, quantity: 2, customization_option_ids: [id] }], p_combine: true });
  });
  it("replaces stale catalogue booleans without modifying administrative flags", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ line_index: 0, product_id: id, available_quantity: 0, is_available: false, is_sold_out: true }], error: null });
    const original = { id, is_available: true, is_sold_out: false };
    expect(await withProductAvailability([original])).toEqual([{ ...original, available_quantity: 0, is_available: false, is_sold_out: true }]);
    expect(original.is_available).toBe(true);
  });
  it.each([{}, { items: [] }, { items: [{ product_id: id, quantity: 0 }] }, { items: [{ product_id: id, quantity: 100 }] }, { items: [{ product_id: id, quantity: 1, customization_option_ids: [id, id] }] }])("rejects invalid/oversized/duplicate-option input before RPC", async body => {
    expect((await POST(request(body))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("malformed JSON is 400, not 500", async () => {
    expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rate limiting prevents querying inventory", async () => {
    mocks.allowed.mockResolvedValue(false); expect((await POST(request({ items: [{ product_id: id, quantity: 1 }] }))).status).toBe(429); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("missing migration/query error fails closed with a public message", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "PRIVATE" } });
    const response = await POST(request({ items: [{ product_id: id, quantity: 1 }] })); expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("PRIVATE");
  });
  it.each([{ data: [] }, { data: [{ line_index: 0, product_id: "wrong", available_quantity: 1, is_available: true, is_sold_out: false }] }, { data: [{ line_index: 0, product_id: id, available_quantity: "NaN", is_available: true, is_sold_out: false }] }])("rejects incomplete/inconsistent inventory response", async ({ data }) => {
    mocks.rpc.mockResolvedValue({ data, error: null });
    expect((await POST(request({ items: [{ product_id: id, quantity: 1 }] }))).status).toBe(503);
  });
});
