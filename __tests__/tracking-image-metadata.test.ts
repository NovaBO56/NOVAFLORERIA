import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), scheduleRead: vi.fn(), photoRead: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc, from: mocks.from }) }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => true, rateLimitResponse: vi.fn() }));
import { POST } from "@/app/api/orders/track/route";

const item = { product_name: "Ramo comprado", quantity: 1, unit_price: 145, line_total: 145, message: "Mensaje histórico" };
const order = { id: "verified-order", order_number: 16, total: 145, items: [item] };
const request = () => new Request("http://localhost/api/orders/track", { method: "POST", body: JSON.stringify({ order_number: 16, customer_phone: "70000000" }) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.rpc.mockResolvedValue({ data: order, error: null });
  mocks.scheduleRead.mockResolvedValue({ data: { scheduled_for: null, schedule_status: "pending" }, error: null });
  mocks.photoRead.mockResolvedValue({ data: [{ product_id: "product-a", product_name_snapshot: item.product_name, quantity: 1, unit_price_snapshot: 145, line_total: 145, product: { images: [{ public_url: "/product.webp", sort_order: 0 }] } }], error: null });
  mocks.from.mockImplementation((table: string) => ({
    select: () => ({
      eq: (column: string, value: string) => table === "orders" ? { maybeSingle: () => mocks.scheduleRead(column, value) } : mocks.photoRead(column, value),
    }),
  }));
});

describe("Tracking photo metadata remains behind the existing order authentication", () => {
  it("queries photos only for the authenticated order and preserves the original order data", async () => {
    const response = await POST(request()); const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.order.items).toEqual([{ ...item, image_url: "/product.webp" }]);
    expect(body.order.total).toBe(145);
    expect(mocks.photoRead).toHaveBeenCalledWith("order_id", "verified-order");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("does not query any photo or order rows when number and phone fail authentication", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "P0001" } });
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("keeps tracking available when the optional metadata query returns an error", async () => {
    mocks.photoRead.mockResolvedValue({ data: null, error: { message: "private-diagnostic" } });
    const response = await POST(request()); const body = await response.json();
    expect(response.status).toBe(200); expect(body.order.items).toEqual([{ ...item, image_url: null }]);
    expect(JSON.stringify(body)).not.toContain("private-diagnostic");
  });
  it("keeps tracking available when the optional metadata query throws", async () => {
    mocks.photoRead.mockRejectedValue(new Error("private-diagnostic"));
    const response = await POST(request()); const body = await response.json();
    expect(response.status).toBe(200); expect(body.order.items[0].image_url).toBeNull();
    expect(JSON.stringify(body)).not.toContain("private-diagnostic");
  });
});
