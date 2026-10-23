import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
const schema = z.object({ product_ids: z.array(z.string().uuid()).max(4).refine(ids => new Set(ids).size === ids.length) }).strict();
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success:false },{status:400});
    const { data,error } = await createAdminClient().from("product_recommendations").select("recommended_product_id,sort_order").eq("product_id",id).order("sort_order");
    if (error) return NextResponse.json({success:false,message:"No se pudieron cargar los complementos."},{status:503});
    return NextResponse.json({success:true,product_ids:(data ?? []).map(row=>row.recommended_product_id)});
  } catch { return NextResponse.json({success:false,message:"Acceso exclusivo para administradores."},{status:403}); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json().catch(()=>null));
    if (!z.string().uuid().safeParse(id).success || !parsed.success || parsed.data.product_ids.includes(id)) return NextResponse.json({success:false,message:"Elige hasta cuatro productos distintos del principal."},{status:400});
    const {error} = await createAdminClient().rpc("set_product_recommendations",{p_product:id,p_recommendations:parsed.data.product_ids,p_actor:actor.id});
    if (error) return NextResponse.json({success:false,message:"No se pudo guardar. Revisa que los productos sigan activos y que no se recomienden entre sí formando un ciclo."},{status:400});
    return NextResponse.json({success:true});
  } catch { return NextResponse.json({success:false,message:"Acceso exclusivo para administradores."},{status:403}); }
}
