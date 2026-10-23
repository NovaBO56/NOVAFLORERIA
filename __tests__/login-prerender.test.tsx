import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => vi.fn(() => { throw new Error("Missing environment"); }));
vi.mock("@/lib/supabase/client", () => ({ createClient: client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
import LoginPage from "@/app/login/page";

describe("Login static prerender without Preview credentials", () => {
  it("renders the access form without initializing Auth or requiring private configuration", () => {
    vi.stubGlobal("React", React);
    try {
      const html = renderToStaticMarkup(<LoginPage />);
      expect(html).toContain("Iniciar sesión");
      expect(html).toContain('type="password"');
      expect(client).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
