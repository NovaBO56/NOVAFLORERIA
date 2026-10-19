import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ publicQuery: vi.fn(), components: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ order: mocks.publicQuery }) }) }) }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
import { GET } from "@/app/api/promotions/route";
describe("Public promotion conditions remain a whitelisted server read", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.admin.mockReturnValue({ from: () => ({ select: () => ({ in: mocks.components }) }) }); });
  it("inactive rows are restricted by the existing is_active query; expired/future rows and their associations are omitted", async () => {
    mocks.publicQuery.mockResolvedValue({ data: [{ id: "expired", ends_at: "2000-01-01" }, { id: "future", starts_at: "2999-01-01" }], error: null });
    const response = await GET(); expect(await response.json()).toEqual({ success: true, promotions: [] }); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("reads associations only for public promotions and returns no staff fields", async () => {
    mocks.publicQuery.mockResolvedValue({ data: [{ id: "visible", name: "TEST", starts_at: null, ends_at: null }], error: null });
    mocks.components.mockResolvedValue({ data: [{ promotion_id: "visible", product_id: "rose", quantity: "2", product: { price: "100", internal_note: "PRIVATE" }, created_by: "PRIVATE" }, { promotion_id: "not-visible", product_id: "other", quantity: 1, product: { price: 3 } }], error: null });
    const response = await GET(); const body = await response.json(); expect(body.promotions[0].products).toEqual([{ product_id: "rose", quantity: 2, unit_price: 100 }]); expect(JSON.stringify(body)).not.toContain("PRIVATE"); expect(mocks.components).toHaveBeenCalledWith("promotion_id", ["visible"]);
  });
  it("fails safely when conditions cannot be read instead of suggesting an unverified offer", async () => {
    mocks.publicQuery.mockResolvedValue({ data: [{ id: "visible" }], error: null }); mocks.components.mockResolvedValue({ data: null, error: { code: "XX000" } }); expect((await GET()).status).toBe(503);
  });
});
