import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), privateClient: vi.fn(), privateRemove: vi.fn(), staffRemove: vi.fn(), upload: vi.fn(), insertResult: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireEmployeeOrAdmin: mocks.authorize }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.privateClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  from: (table: string) => table === "products" ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "test" }, error: null }) }) }) } : {
    select: () => ({ eq: async () => ({ count: 0, error: null }) }),
    insert: () => ({ select: () => ({ single: mocks.insertResult }) }),
  },
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.staffRemove, getPublicUrl: () => ({ data: { publicUrl: "http://127.0.0.1/image.webp" } }) }) },
}) }));
import { POST } from "@/app/api/admin/products/[id]/images/route";
const id = "550e8400-e29b-41d4-a716-446655440000";
async function request() { const png=await sharp({create:{width:15,height:15,channels:3,background:"white"}}).png().toBuffer(); const form=new FormData(); form.append("file",new Blob([new Uint8Array(png)],{type:"image/png"}),"test.png"); return new Request("http://localhost/api/admin/products/"+id+"/images",{method:"POST",body:form}); }
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console,"error").mockImplementation(()=>{}); mocks.authorize.mockResolvedValue({}); mocks.upload.mockResolvedValue({error:null}); mocks.privateRemove.mockResolvedValue({error:null}); mocks.privateClient.mockReturnValue({storage:{from:()=>({remove:mocks.privateRemove})}}); });
afterEach(()=>vi.restoreAllMocks());
describe("image DB failure compensation (unit mocks, real decoder)",()=>{
  it("removes only the exact newly uploaded path with private client after insert fails",async()=>{ mocks.insertResult.mockResolvedValue({data:null,error:{code:"23514"}}); const result=await POST(await request(),{params:Promise.resolve({id})}); expect(result.status).toBe(500); const uploadedPath=mocks.upload.mock.calls[0][0]; expect(uploadedPath).toMatch(new RegExp("^products/"+id+"/[0-9a-f-]+\\.webp$")); expect(mocks.privateRemove).toHaveBeenCalledTimes(1); expect(mocks.privateRemove).toHaveBeenCalledWith([uploadedPath]); expect(mocks.staffRemove).not.toHaveBeenCalled(); });
  it("does not instantiate private compensation client on successful insert",async()=>{mocks.insertResult.mockResolvedValue({data:{id},error:null});expect((await POST(await request(),{params:Promise.resolve({id})})).status).toBe(201);expect(mocks.privateClient).not.toHaveBeenCalled();});
  it("unauthorized upload never reaches storage or private client",async()=>{mocks.authorize.mockRejectedValue(new Error("No autorizado"));expect((await POST(await request(),{params:Promise.resolve({id})})).status).toBe(403);expect(mocks.upload).not.toHaveBeenCalled();expect(mocks.privateClient).not.toHaveBeenCalled();});
});
