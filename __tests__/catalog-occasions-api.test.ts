import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: async () => ({ data: null, error: null }) } }) }));
import { updateSession } from "@/lib/supabase/proxy";

const db = vi.hoisted(() => ({ range: vi.fn(), eq: vi.fn(), not: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: (table: string) => {
  expect(table).toBe("products");
  return { select: db.select };
} }) }));
import { GET } from "@/app/api/catalog/occasions/route";

beforeEach(() => {
  vi.clearAllMocks();
  db.select.mockReturnValue({ eq: db.eq });
  db.eq.mockReturnValue({ not: db.not });
  db.not.mockReturnValue({ order: () => ({ range: db.range }) });
});

describe("Explicit public occasion attributes (HTTP unit mocks, not real DB)", () => {
  it("remains publicly readable through the real application proxy", async () => {
    const response = await updateSession(new NextRequest("http://localhost/api/catalog/occasions"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it("returns only configured values, without guessing from product names", async () => {
    db.range.mockResolvedValue({ data: [{ occasion: "Amor" }, { occasion: "Amor" }, { occasion: "Cumpleaños" }, { occasion: "" }], error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).occasions).toEqual(["Amor", "Cumpleaños"]);
    expect(db.select).toHaveBeenCalledWith("id, occasion");
    expect(db.eq).toHaveBeenCalledWith("is_active", true);
    expect(db.not).toHaveBeenCalledWith("occasion", "is", null);
  });
  it("collects later pages instead of truncating at the platform page limit", async () => {
    db.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => ({ occasion: "Amor" })), error: null })
      .mockResolvedValueOnce({ data: [{ occasion: "Graduaciones" }], error: null });
    expect((await (await GET()).json()).occasions).toEqual(["Amor", "Graduaciones"]);
    expect(db.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
  it("keeps an empty configuration empty", async () => {
    db.range.mockResolvedValue({ data: [], error: null });
    expect((await (await GET()).json()).occasions).toEqual([]);
  });
  it("does not return a partial list or internal errors if a later page fails", async () => {
    db.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, () => ({ occasion: "Amor" })), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "PRIVATE DATABASE ERROR" } });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("PRIVATE");
  });
  it("fails safely on an unexpected exception", async () => {
    db.range.mockRejectedValue(new Error("PRIVATE"));
    expect((await GET()).status).toBe(503);
  });
});
