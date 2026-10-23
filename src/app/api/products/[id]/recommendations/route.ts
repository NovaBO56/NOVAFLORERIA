import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withProductAvailability } from "@/lib/public/product-availability.server";
export async function GET(_request:Request, context:{params:Promise<{id:string}>}) {
  const {id}=await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({success:false},{status:400});
  try {
    const client=await createClient();
    const {data,error}=await client.from("product_recommendations").select("recommended_product_id,sort_order").eq("product_id",id).order("sort_order").limit(4);
    if (error) return NextResponse.json({success:false,message:"No pudimos consultar los complementos."},{status:503});
    if (!data?.length) return NextResponse.json({success:true,products:[]});
    const products=await client.from("products").select("id,name,price,category_id,occasion,season_id,is_featured,is_available,is_sold_out,catalog_order,images:product_images(id,public_url,alt_text,sort_order)").in("id",data.map(r=>r.recommended_product_id)).eq("is_active",true).eq("is_available",true).eq("is_sold_out",false).order("sort_order",{foreignTable:"product_images"});
    if(products.error) throw new Error("read");
    const available=await withProductAvailability(products.data ?? []);
    return NextResponse.json({success:true,products:data.flatMap(r=>available.filter(p=>p.id===r.recommended_product_id && p.is_available && !p.is_sold_out))});
  } catch { return NextResponse.json({success:false,message:"No pudimos consultar los complementos."},{status:503}); }
}
