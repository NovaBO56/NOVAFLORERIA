import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  status: vi.fn(),
  week: vi.fn(),
  delivery: vi.fn(),
  allowed: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: (...args: unknown[]) => ({ maybeSingle: () => mocks.status(...args) }),
    from: () => ({ select: () => ({ order: async () => mocks.week() }) }),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => mocks.delivery() }) }) }),
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.allowed,
  rateLimitResponse: () => new Response(JSON.stringify({ success: false }), { status: 429 }),
}));

import { GET } from "@/app/api/business-hours/route";

describe("GET /api/business-hours delivery availability", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.allowed.mockResolvedValue(true);
    mocks.status.mockResolvedValue({ data: { is_open: true }, error: null });
    mocks.week.mockResolvedValue({ data: [], error: null });
    mocks.delivery.mockResolvedValue({ data: { value: { enabled: true }, updated_by: "private-actor" }, error: null });
  });

  it("returns only the public availability boolean alongside existing status", async () => {
    const response = await GET(new Request("http://localhost/api/business-hours"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ success: true, status: { is_open: true, delivery_enabled: true }, week: [] });
    expect(JSON.stringify(body)).not.toContain("private-actor");
  });

  it("fails closed when the setting is missing or malformed", async () => {
    mocks.delivery.mockResolvedValue({ data: null, error: null });
    const missing = await GET(new Request("http://localhost/api/business-hours"));
    expect((await missing.json()).status.delivery_enabled).toBe(false);

    mocks.delivery.mockResolvedValue({ data: { value: { enabled: "true" } }, error: null });
    const malformed = await GET(new Request("http://localhost/api/business-hours"));
    expect((await malformed.json()).status.delivery_enabled).toBe(false);
  });

  it("preserves rate limiting before querying delivery settings", async () => {
    mocks.allowed.mockResolvedValue(false);
    expect((await GET(new Request("http://localhost/api/business-hours"))).status).toBe(429);
    expect(mocks.delivery).not.toHaveBeenCalled();
  });
});
