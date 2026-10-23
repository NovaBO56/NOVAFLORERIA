import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: async () => ({ data: null, error: null }) } }) }));
import { updateSession } from "@/lib/supabase/proxy";
describe("Public storefront media routing (session mocked, not real Auth)", () => {
  it("lets an anonymous visitor load public media without redirecting to login", async () => {
    const response = await updateSession(new NextRequest("http://localhost/api/storefront-media"));
    expect(response.status).toBe(200); expect(response.headers.get("location")).toBeNull();
  });
  it("keeps the administrative upload route private", async () => {
    const response = await updateSession(new NextRequest("http://localhost/api/admin/storefront-media"));
    expect(response.status).toBe(307); expect(response.headers.get("location")).toContain("/login");
  });
});
