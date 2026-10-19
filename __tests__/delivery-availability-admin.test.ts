import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  adminFactory: vi.fn(),
  updated: vi.fn(),
}));

vi.mock("@/lib/auth/permissions", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.adminFactory }));

import { PATCH } from "@/app/api/admin/system-settings/route";

const actorId = "550e8400-e29b-41d4-a716-446655440000";
const settingKey = "delivery_enabled";

function request(value: unknown) {
  return new Request(`http://localhost/api/admin/system-settings?key=${settingKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: actorId });
  mocks.adminFactory.mockReturnValue({
    from: () => {
      let singleCount = 0;
      const query = {
        select: () => query,
        eq: () => query,
        update: (values: unknown) => { mocks.updated(values); return query; },
        single: async () => singleCount++ === 0
          ? { data: { key: settingKey, value: { enabled: true }, is_critical: true }, error: null }
          : { data: { key: settingKey, value: { enabled: false }, is_critical: true, updated_by: actorId }, error: null },
      };
      return query;
    },
  });
});

describe("admin delivery availability setting", () => {
  it("stores a normalized boolean and the authenticated administrator id", async () => {
    const response = await PATCH(request({ enabled: false, unexpected: "ignored" }));
    expect(response.status).toBe(200);
    expect(mocks.updated).toHaveBeenCalledWith(expect.objectContaining({ value: { enabled: false }, updated_by: actorId }));
    expect(JSON.stringify(mocks.updated.mock.calls)).not.toContain("unexpected");
  });

  it("rejects malformed values before the update", async () => {
    const response = await PATCH(request({ enabled: "false" }));
    expect(response.status).toBe(400);
    expect(mocks.updated).not.toHaveBeenCalled();
  });

  it("requires administrator access before reading or changing the setting", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Acceso no autorizado."));
    expect((await PATCH(request({ enabled: false }))).status).toBe(403);
    expect(mocks.adminFactory).not.toHaveBeenCalled();
  });
});
