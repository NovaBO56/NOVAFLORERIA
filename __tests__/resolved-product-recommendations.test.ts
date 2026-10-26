import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn(), availability: vi.fn(), eq: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => {
  const query = { select: (fields: string) => { mocks.select(fields); return query; }, in: () => query, order: () => query, eq: (field: string,value: unknown) => { mocks.eq(field,value); return query; }, then: (resolve: (value: unknown) => void) => mocks.read().then(resolve) };
  return { rpc: mocks.rpc, from: () => query };
} }));
vi.mock("@/lib/public/product-availability.server", () => ({ withProductAvailability: mocks.availability }));
import { resolvedRecommendations } from "@/lib/product-recommendations.server";
import { GET } from "@/app/api/products/[id]/recommendations/route";
const id = "550e8400-e29b-41d4-a716-446655440000";
const products = ["a","b","c","d","e","f"].map((id,index) => ({ id, name: id, price: 20 + index, is_available: true, is_sold_out: false, images: [] }));
beforeEach(() => {
  vi.resetAllMocks(); mocks.rpc.mockResolvedValue({ data: [id, ...products.map(p=>p.id)], error: null });
  mocks.read.mockResolvedValue({ data: products, error: null });
  mocks.availability.mockImplementation(async values => values.map((p: { id: string }) => ({ ...p, is_available: p.id !== "b", is_sold_out: p.id === "b" })));
});
describe("Public resolution with mocked DB, real route and resolver", () => {
  it("excludes cart/main/unavailable items before limiting to four, preserving priority and prices", async () => {
    const result = await resolvedRecommendations(id, ["a"]);
    expect(result.map(p => [p.id,p.price])).toEqual([["c",22],["d",23],["e",24],["f",25]]);
    expect(mocks.eq).toHaveBeenCalledWith("is_active",true);
    expect(mocks.eq).toHaveBeenCalledWith("is_available",true);
    expect(mocks.eq).toHaveBeenCalledWith("is_sold_out",false);
    expect(mocks.select.mock.calls[0][0]).not.toContain("updated_by");
  });
  it("does not query products for an explicit empty/off result", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await resolvedRecommendations(id)).toEqual([]);
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("rejects invalid main/exclusion UUIDs before RPC", async () => {
    expect((await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "bad" }) })).status).toBe(400);
    expect((await GET(new Request("http://localhost?exclude=bad"), { params: Promise.resolve({ id }) })).status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("sanitizes service/RPC failures", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "private SQL detail" } });
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain("private SQL detail");
  });
});
