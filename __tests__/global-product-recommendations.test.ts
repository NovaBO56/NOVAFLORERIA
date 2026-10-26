import { beforeEach, describe, expect, it, vi } from "vitest";
import { globalRecommendationsSchema, recommendationModeSchema, emptyGlobalRecommendations } from "@/validations/product-recommendations";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/product-recommendations.server", () => ({ recommendationProducts: vi.fn() }));
import { PUT } from "@/app/api/admin/product-recommendations/route";
import { PATCH } from "@/app/api/admin/products/[id]/recommendations/route";
const id = "550e8400-e29b-41d4-a716-446655440000", extra = "550e8400-e29b-41d4-a716-446655440001";
const req = (body: unknown) => new Request("http://localhost", { method: "PUT", body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mocks.admin.mockResolvedValue({ id: "verified" }); mocks.rpc.mockResolvedValue({ data: 1, error: null }); });
describe("Global configuration validation and routes (mocked Auth/DB)", () => {
  it("allows a disabled empty installation and an explicit empty custom mode", () => {
    expect(globalRecommendationsSchema.safeParse(emptyGlobalRecommendations).success).toBe(true);
    expect(recommendationModeSchema.safeParse({ mode: "custom", product_ids: [], revision: 0 }).success).toBe(true);
    expect(recommendationModeSchema.safeParse({ mode: "off", revision: 0 }).success).toBe(true);
    expect(recommendationModeSchema.safeParse({ mode: "global", revision: 0 }).success).toBe(true);
  });
  it("requires categories only when an enabled category scope is used", () => {
    expect(globalRecommendationsSchema.safeParse({ ...emptyGlobalRecommendations, enabled: true, scope: "categories" }).success).toBe(false);
    expect(globalRecommendationsSchema.safeParse({ ...emptyGlobalRecommendations, enabled: true, scope: "categories", category_ids: [id] }).success).toBe(true);
  });
  it("rejects duplicate IDs, excessive lists, spoofed prices/actor and invalid references", async () => {
    for (const body of [{ ...emptyGlobalRecommendations, product_ids: [id,id] }, { ...emptyGlobalRecommendations, product_ids: Array(21).fill(id) }, { ...emptyGlobalRecommendations, actor: "spoof" }, { ...emptyGlobalRecommendations, price: 0 }, { ...emptyGlobalRecommendations, excluded_product_ids: ["invalid"] }]) {
      expect((await PUT(req(body))).status).toBe(400);
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("denies employee/anonymous before malformed JSON is read", async () => {
    mocks.admin.mockRejectedValue(new Error("denied"));
    expect((await PUT(new Request("http://localhost", { method: "PUT", body: "{" }))).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("malformed JSON is 400 without a mutation", async () => {
    expect((await PUT(new Request("http://localhost", { method: "PUT", body: "{" }))).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("sends only validated IDs and a verified actor to the atomic RPC", async () => {
    expect((await PUT(req({ ...emptyGlobalRecommendations, product_ids: [extra] }))).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("save_global_product_recommendations", expect.objectContaining({ p_products: [extra], p_actor: "verified", p_revision: 0 }));
  });
  it("returns 409 for concurrent revision conflicts without leaking DB details", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "40001", message: "private detail" } });
    const response = await PUT(req(emptyGlobalRecommendations));
    expect(response.status).toBe(409); expect(JSON.stringify(await response.json())).not.toContain("private detail");
  });
  it.each(["global", "off"])("switches to %s without deleting or rewriting custom IDs", async mode => {
    expect((await PATCH(req({ mode, revision: 0 }), { params: Promise.resolve({ id }) })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("save_product_recommendation_preferences", { p_product: id, p_mode: mode, p_recommendations: null, p_revision: 0, p_actor: "verified" });
  });
});
