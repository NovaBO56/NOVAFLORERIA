import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({ authenticated: false, getClaims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: auth.getClaims } }) }));
import { updateSession } from "@/lib/supabase/proxy";

const origin = "https://anabelle.example.invalid";
function loginRequest(redirect?: string) {
  const url = new URL("/login", origin);
  if (redirect !== undefined) url.searchParams.set("redirect", redirect);
  return new NextRequest(url);
}

beforeEach(() => {
  auth.authenticated = false;
  auth.getClaims.mockReset();
  auth.getClaims.mockImplementation(async () => ({ data: { claims: auth.authenticated ? { sub: "synthetic-staff" } : null }, error: null }));
});

describe("Actual session proxy login redirects", () => {
  it.each(["/admin/pedidos?buscar=16", "/admin/usuarios", "/admin/productos#fotos"])("authenticated user retains internal target %s", async target => {
    auth.authenticated = true;
    const response = await updateSession(loginRequest(target));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(new URL(target, origin).href);
  });

  it.each([
    undefined, "https://example.invalid", "//example.invalid", "/\\example.invalid",
    "/%2fexample.invalid", "/%255cexample.invalid", "/%0a/example.invalid",
    "/admin/..//example.invalid", "/admin/%252e%252e/%252fexample.invalid",
  ])("authenticated /login rejects unsafe or missing redirect %s", async target => {
    auth.authenticated = true;
    const response = await updateSession(loginRequest(target));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(origin + "/admin");
  });

  it("keeps the login form accessible without a session", async () => {
    const response = await updateSession(loginRequest("//example.invalid"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/admin", "/admin/pedidos?buscar=16&page=2", "/admin/usuarios"])("unauthenticated protected request %s returns to login on the same origin", async route => {
    const response = await updateSession(new NextRequest(origin + route));
    const location = new URL(response.headers.get("location")!);
    expect(response.status).toBe(307);
    expect(location.origin).toBe(origin);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe(route);
  });

  it.each(["/", "/checkout", "/seguimiento", "/api/products", "/api/orders/track"])("preserves anonymous public route %s", async route => {
    const response = await updateSession(new NextRequest(origin + route));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not alter protected-route navigation for an authenticated user", async () => {
    auth.authenticated = true;
    const response = await updateSession(new NextRequest(origin + "/admin/pedidos"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
