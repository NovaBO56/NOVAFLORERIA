import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { visualPreviewEnabled } from "@/lib/visual-preview/config";
import { visualCatalogResponse, type VisualSnapshot } from "@/lib/visual-preview/catalog";

vi.mock("@/lib/supabase/proxy", () => ({ updateSession: vi.fn(() => { throw Error("Auth must not run in visual preview"); }) }));
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
import { readFile } from "node:fs/promises";
import { proxy } from "@/proxy";
import { GET } from "@/app/api/visual-preview/route";
import { updateSession } from "@/lib/supabase/proxy";

const flags = { NOVA_VISUAL_PREVIEW: "true", NEXT_PUBLIC_NOVA_VISUAL_PREVIEW: "true", VERCEL_ENV: "preview" };
const product = { id: "550e8400-e29b-41d4-a716-446655440000", name: "LAB100 ramo", price: 45, category_id: null, season_id: null, occasion: null, is_featured: true, is_available: true, is_sold_out: false, catalog_order: 1, images: [], customization_options: [], description: "Demostración", components: [] };
const snapshot: VisualSnapshot = { version: 1, synthetic: true, products: [product], promotions: [], categories: [], hours: { status: { is_open: true, opens_at: "08:00", closes_at: "20:00", is_closed_today: false, accept_orders_outside_hours: false }, week: [] } };
const query = (path: string, extra = "") => visualCatalogResponse(snapshot, new URL(`http://localhost/api/visual-preview?path=${encodeURIComponent(path)}${extra}`));
function enable() {
  for (const name of Object.keys(process.env).filter(name => /SUPABASE/i.test(name))) vi.stubEnv(name, "");
  for (const [name, value] of Object.entries(flags)) vi.stubEnv(name, value);
  vi.stubEnv("VERCEL_GIT_COMMIT_REF", "codex/inventory-refunds-dashboard-2"); vi.stubEnv("NOVA_LOCAL_LAB", "");
}
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("Database-free visual preview (unit, not a published deployment)", () => {
  it("keeps ordinary environments unchanged unless explicitly enabled", () => {
    expect(visualPreviewEnabled({ NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid" })).toBe(false);
    expect(visualPreviewEnabled(flags)).toBe(true);
  });
  it.each([
    { ...flags, VERCEL_ENV: "production" }, { ...flags, VERCEL_GIT_COMMIT_REF: "master" },
    { NOVA_VISUAL_PREVIEW: "true" }, { ...flags, NEXT_PUBLIC_SUPABASE_URL: "http://localhost:62621" },
    { ...flags, SUPABASE_SECRET_KEY: "fake-test-value" }, { ...flags, NOVA_LOCAL_LAB: "true" },
  ])("fails closed with conflicting deployment or database configuration", env => expect(() => visualPreviewEnabled(env)).toThrow());
  it("serves a local snapshot with pagination, filters and product customization only", () => {
    expect(query("/api/catalog/occasions").body).toMatchObject({ occasions: [] });
    expect(query("/api/products").body).toMatchObject({ success: true, visual_preview: true, pagination: { total: 1 } });
    expect(query("/api/products", "&page=100").body).toMatchObject({ products: [] });
    expect(query("/api/products", "&search=other").body).toMatchObject({ products: [] });
    expect(query(`/api/products/${product.id}`).body).toMatchObject({ product });
    expect(query("/api/products/invalid").status).toBe(400);
    expect(query("/api/products/550e8400-e29b-41d4-a716-446655440001").status).toBe(404);
  });
  it("never supplies QR, WhatsApp, order/receipt or admin data", () => {
    for (const route of ["/api/payment-qr", "/api/whatsapp-config"]) expect(query(route).status).toBe(404);
    for (const route of ["/api/orders", "/api/orders/track", "/api/orders/receipt/token", "/api/admin/products"]) expect(query(route).status).toBe(403);
    expect(query("/api/store-location").body).toMatchObject({ location: null });
  });
  it("routes public data to the snapshot and blocks all write methods before Auth", async () => {
    enable();
    const response = await proxy(new NextRequest("http://localhost/api/products?limit=8"));
    expect(response.headers.get("x-middleware-rewrite")).toContain("/api/visual-preview?");
    for (const method of ["POST", "PATCH", "DELETE", "PUT"]) expect((await proxy(new NextRequest("http://localhost/api/orders", { method }))).status).toBe(403);
    expect(updateSession).not.toHaveBeenCalled();
  });
  it("disables login/admin and adds noindex/network restrictions to public pages", async () => {
    enable();
    expect((await proxy(new NextRequest("http://localhost/login"))).status).toBe(404);
    expect((await proxy(new NextRequest("http://localhost/admin"))).status).toBe(404);
    const response = await proxy(new NextRequest("http://localhost/checkout"));
    expect(response.headers.get("x-robots-tag")).toContain("noindex"); expect(response.headers.get("content-security-policy")).toContain("connect-src 'self'");
    expect(updateSession).not.toHaveBeenCalled();
  });
  it("returns 503 instead of reaching Auth when misconfigured", async () => {
    enable(); vi.stubEnv("SUPABASE_SECRET_KEY", "fake-test-value");
    expect((await proxy(new NextRequest("http://localhost/"))).status).toBe(503); expect(updateSession).not.toHaveBeenCalled();
  });
  it("reads the packaged synthetic file without a network call and hides the endpoint outside Preview", async () => {
    enable(); vi.mocked(readFile).mockResolvedValue(JSON.stringify(snapshot));
    const fetch = vi.spyOn(globalThis, "fetch");
    const response = await GET(new Request("http://localhost/api/visual-preview?path=/api/products"));
    expect(response.status).toBe(200); expect(fetch).not.toHaveBeenCalled();
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ ...snapshot, synthetic: false }));
    expect((await GET(new Request("http://localhost/api/visual-preview"))).status).toBe(503);
    vi.stubEnv("NOVA_VISUAL_PREVIEW", ""); vi.stubEnv("NEXT_PUBLIC_NOVA_VISUAL_PREVIEW", "");
    expect((await GET(new Request("http://localhost/api/visual-preview"))).status).toBe(404);
  });
});
