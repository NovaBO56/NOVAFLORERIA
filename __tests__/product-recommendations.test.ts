import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({admin:vi.fn(),rpc:vi.fn(),preference:vi.fn()}));
vi.mock("@/lib/auth/permissions",()=>({requireAdmin:mocks.admin}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>({rpc:mocks.rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.preference})})})})}));
import { PUT } from "@/app/api/admin/products/[id]/recommendations/route";
const id="550e8400-e29b-41d4-a716-446655440000",other="550e8400-e29b-41d4-a716-446655440001";
const context={params:Promise.resolve({id})};
const request=(body:unknown)=>new Request("http://localhost/api/admin/products/"+id+"/recommendations",{method:"PUT",body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();mocks.admin.mockResolvedValue({id:"actor"});mocks.rpc.mockResolvedValue({data:1,error:null});mocks.preference.mockResolvedValue({data:null,error:null});});
describe("Recommendation admin HTTP contract (mocked permissions/DB, not real RLS)",()=>{
  it("denies employee before any mutation",async()=>{mocks.admin.mockRejectedValue(new Error("denied"));expect((await PUT(request({product_ids:[other]}),context)).status).toBe(403);expect(mocks.rpc).not.toHaveBeenCalled();});
  it.each([{product_ids:[id]},{product_ids:[other,other]},{product_ids:["invalid"]},{product_ids:[other],actor:"spoof"},{product_ids:Array(5).fill(other)}])("rejects malformed/self/duplicate/extra-field input %j",async body=>{expect((await PUT(request(body),context)).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();});
  it("uses verified actor and preserves explicit order",async()=>{expect((await PUT(request({product_ids:[other]}),context)).status).toBe(200);expect(mocks.rpc).toHaveBeenCalledWith("save_product_recommendation_preferences",{p_product:id,p_mode:"custom",p_recommendations:[other],p_revision:0,p_actor:"actor"});});
  it("allows explicitly clearing all suggestions",async()=>{expect((await PUT(request({product_ids:[]}),context)).status).toBe(200);});
  it("returns plain business error on cycle/disabled product without DB details",async()=>{mocks.rpc.mockResolvedValue({error:{message:"private schema detail"}});const response=await PUT(request({product_ids:[other]}),context);expect(response.status).toBe(400);expect(JSON.stringify(await response.json())).not.toContain("private schema");});
  it("malformed JSON returns 400 without mutations",async()=>{const response=await PUT(new Request("http://localhost",{method:"PUT",body:"{"}),context);expect(response.status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();});
});
