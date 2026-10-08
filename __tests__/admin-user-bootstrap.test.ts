import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), factory: vi.fn(), createUser: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.factory }));
import { POST } from "@/app/api/admin/users/create/route";
const request = () => new Request("http://localhost/api/admin/users/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test-security@example.invalid", password: "TEST-SECURITY-only", full_name: "TEST SECURITY", role: "empleado" }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.factory.mockReturnValue({ auth: { admin: { createUser: mocks.createUser } }, from: () => ({ update: mocks.update }) });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockResolvedValue({ error: null });
  mocks.createUser.mockResolvedValue({ data: { user: { id: "test-user", email: "test-security@example.invalid" } }, error: null });
});
describe("Alta administrativa tras bootstrap inactivo (mocks)", () => {
  it("activa explícitamente solo después de requireAdmin", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ role: "empleado", is_active: true }));
    expect(mocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(mocks.factory.mock.invocationCallOrder[0]);
  });
  it("no crea usuario privilegiado si falla autorización", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("No autorizado"));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.factory).not.toHaveBeenCalled();
  });
});
