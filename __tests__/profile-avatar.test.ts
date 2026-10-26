import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { MAX_AVATAR_BYTES, normalizeAvatar, readAvatarBody } from "@/lib/profile-avatar";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), list: vi.fn(), download: vi.fn(), upload: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireEmployeeOrAdmin: mocks.auth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ storage: { from: mocks.from } }) }));
import { GET, PUT, DELETE } from "@/app/api/admin/profile/avatar/route";
const base = "http://localhost:3117/api/admin/profile/avatar";
const png = () => sharp({ create: { width: 40, height: 60, channels: 3, background: "red" } }).png().toBuffer();
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: "owner-id", role: "empleado", is_active: true });
  mocks.from.mockReturnValue(mocks); mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.upload.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null });
});

describe("Private profile photo authorization and persistence", () => {
  it("rejects unauthenticated/inactive requests before storage", async () => {
    mocks.auth.mockRejectedValue(Error("inactive"));
    for (const handler of [GET, PUT, DELETE]) expect((await handler(new Request(base))).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("uses the session owner rather than supplied IDs", async () => {
    await DELETE(new Request(base + "?user_id=other", { method: "DELETE", headers: { Origin: "http://localhost:3117" } }));
    expect(mocks.remove).toHaveBeenCalledWith(["owner-id/avatar.webp"]);
  });
  it("blocks cross-origin changes", async () => {
    for (const handler of [PUT, DELETE]) expect((await handler(new Request(base, { method: "PUT", headers: { Origin: "https://example.com" } }))).status).toBe(403);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("reports no photo without inventing a URL", async () => {
    const response = await GET(new Request(base));
    expect(await response.json()).toEqual({ success: true, hasPhoto: false });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("reads only the owner's file", async () => {
    mocks.download.mockResolvedValue({ data: new Blob(["image"], {type:"image/webp"}), error: null });
    const response = await GET(new Request(base + "?image=1&user_id=other"));
    expect(response.status).toBe(200); expect(mocks.download).toHaveBeenCalledWith("owner-id/avatar.webp");
    expect(response.headers.get("content-type")).toBe("image/webp");
  });
  it("stores a normalized image for active staff", async () => {
    const response = await PUT(new Request(base, { method: "PUT", headers: { Origin:"http://localhost:3117", "Content-Type":"image/png" }, body: new Uint8Array(await png()) }));
    expect(response.status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith("profile-avatars");
    expect(mocks.upload.mock.calls[0][0]).toBe("owner-id/avatar.webp");
    const meta = await sharp(mocks.upload.mock.calls[0][1]).metadata();
    expect([meta.format,meta.width,meta.height]).toEqual(["webp",256,256]);
    expect(meta.exif).toBeUndefined();
  });
  it("does not delete the previous photo when upload fails", async () => {
    mocks.upload.mockResolvedValue({ error: Error("storage down") });
    const response = await PUT(new Request(base, { method:"PUT", headers:{ Origin:"http://localhost:3117", "Content-Type":"image/png" }, body: new Uint8Array(await png()) }));
    expect(response.status).toBe(503); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("reports storage read and deletion failures", async () => {
    mocks.list.mockResolvedValue({ error: Error("down") });
    expect((await GET(new Request(base))).status).toBe(503);
    mocks.remove.mockResolvedValue({ error: Error("down") });
    expect((await DELETE(new Request(base, {method:"DELETE",headers:{Origin:"http://localhost:3117"}}))).status).toBe(503);
  });
});
describe("Photo validation", () => {
  it("rejects SVG even when disguised as PNG", async () => {
    await expect(normalizeAvatar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>'))).rejects.toThrow();
    await expect(readAvatarBody(new Request(base,{method:"PUT",headers:{"Content-Type":"image/svg+xml"},body:"svg"}))).rejects.toThrow();
  });
  it("rejects corrupt and empty images", async () => {
    await expect(normalizeAvatar(Buffer.from("not an image"))).rejects.toThrow();
    await expect(normalizeAvatar(Buffer.alloc(0))).rejects.toThrow();
  });
  it("bounds streamed bodies without relying on Content-Length", async () => {
    const request = new Request(base,{method:"PUT",headers:{"Content-Type":"image/png"},body:new Uint8Array(MAX_AVATAR_BYTES+1)});
    await expect(readAvatarBody(request)).rejects.toMatchObject({status:413});
  });
  it("rejects high pixel-count images", async () => {
    const huge = await sharp({create:{width:4100,height:4000,channels:3,background:"white"}}).png().toBuffer();
    await expect(normalizeAvatar(huge)).rejects.toThrow();
  });
});
