import { describe, expect, it } from "vitest";
import { loginDestination } from "@/lib/auth/login-destination";

export const unsafeLoginDestinations = [
  "https://example.invalid", "http://example.invalid/admin", "javascript:alert(1)",
  "//example.invalid", "///example.invalid", "/\\example.invalid", "\\\\example.invalid",
  "/admin\\..\\example.invalid", "/\n/example.invalid", "/\r/example.invalid",
  "/\t/example.invalid", "/\u0000/example.invalid", "/\u007f/example.invalid", "/\u0085/example.invalid",
  "/%2fexample.invalid", "/%2F%2Fexample.invalid", "/%5cexample.invalid", "/%5C/example.invalid",
  "/%00/example.invalid", "/%0a/example.invalid", "/%0d%0aLocation:example.invalid", "/%7f/example.invalid",
  "/%252fexample.invalid", "/%255cexample.invalid", "/%250a/example.invalid",
  "/%25252fexample.invalid", "/%2525252525252525252fexample.invalid",
  "/admin/..//example.invalid", "/admin/%2e%2e//example.invalid", "/admin/%252e%252e/%252fexample.invalid",
  "%2f%2fexample.invalid", " /admin", "admin/pedidos", "", "/admin?search=%E0%A4%A",
];

describe("Central login destination validation", () => {
  it.each([
    "/", "/admin", "/admin/pedidos?buscar=16&page=2", "/admin/productos#fotografias",
    "/admin/usuarios", "/checkout", "/seguimiento", "/admin/clientes?buscar=Jos%C3%A9",
    "/admin/productos?buscar=100%25", "/admin?next=https%3A%2F%2Fexample.invalid",
  ])("preserves safe internal destination %s", destination => {
    expect(loginDestination(destination)).toBe(destination);
  });

  it.each(unsafeLoginDestinations)("falls back for unsafe destination %s", destination => {
    expect(loginDestination(destination)).toBe("/admin");
  });

  it("uses the existing internal fallback when redirect is absent", () => {
    expect(loginDestination(null)).toBe("/admin");
  });

  it("keeps every output on the request origin across encoded separator/control variants", () => {
    const origins = ["http://127.0.0.1:3117", "https://anabelle.example.invalid"];
    for (const origin of origins) {
      for (const value of [...unsafeLoginDestinations, "/admin/pedidos?buscar=16"]) {
        const target = new URL(loginDestination(value), origin);
        expect(target.origin).toBe(origin);
        expect(target.pathname.startsWith("//")).toBe(false);
      }
    }
  });
});
