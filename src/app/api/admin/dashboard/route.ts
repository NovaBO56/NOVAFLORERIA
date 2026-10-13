import { NextResponse } from "next/server";
import { requireEmployeeOrAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { businessDate } from "@/lib/business-date";
import { readAllPages } from "@/lib/db/read-all-pages";
import { readSalesLedger } from "@/lib/reports/sales-ledger";
import { salesReportQuerySchema } from "@/validations/reports";

export async function GET(request: Request) {
 try {
  await requireEmployeeOrAdmin();
  const params = new URL(request.url).searchParams, today = businessDate();
  const parsed = salesReportQuerySchema.safeParse({from:params.get("from")??today,to:params.get("to")??today});
  if (!parsed.success || new Date(parsed.data.to).getTime()-new Date(parsed.data.from).getTime()>365*86400000) {
   return NextResponse.json({success:false,message:"Selecciona un rango válido de hasta 366 días."},{status:400});
  }
  const client=await createClient(); const {from,to}=parsed.data;
  const [ledger,orders,inventory,pending]=await Promise.all([
   readSalesLedger(client,from,to),
   readAllPages<{status:string;created_at:string}>((start,end)=>client.from("orders").select("status,created_at",{count:"exact"}).is("deleted_at",null).order("id").range(start,end)),
   readAllPages<{id:string;name:string;current_stock:number;minimum_stock:number;unit:string}>((start,end)=>client.from("inventory_items").select("id,name,current_stock,minimum_stock,unit",{count:"exact"}).eq("is_active",true).order("id").range(start,end)),
   client.from("payments").select("id",{count:"exact",head:true}).eq("status","pendiente"),
  ]);
  if(pending.error)throw pending.error;
  const statuses=Object.fromEntries(["pendiente_pago","confirmado","en_preparacion","listo","finalizado"].map(status=>[status,orders.filter(order=>order.status===status).length]));
  const products=new Map<string,{name:string;quantity:number}>();
  const ids=ledger.events.filter(event=>event.kind==="sale").map(event=>event.order_id);
  for(let index=0;index<ids.length;index+=100){
   const items=await readAllPages<{product_id:string;product_name_snapshot:string;quantity:number}>((start,end)=>client.from("order_items").select("product_id,product_name_snapshot,quantity",{count:"exact"}).in("order_id",ids.slice(index,index+100)).order("id").range(start,end));
   for(const item of items){const prior=products.get(item.product_id)??{name:item.product_name_snapshot,quantity:0};prior.quantity+=Math.round(Number(item.quantity)*1000);products.set(item.product_id,prior);}
  }
  const recent=await client.from("orders").select("id,order_number,status,updated_at").in("status",["listo","finalizado"]).order("updated_at",{ascending:false}).limit(6);
  if(recent.error)throw recent.error;
  return NextResponse.json({success:true,dashboard:{financial:ledger.summary,today_orders:orders.filter(order=>businessDate(new Date(order.created_at))===today).length,pending_payments:pending.count??0,statuses,
   inventory:inventory.filter(item=>Number(item.current_stock)<=Number(item.minimum_stock)).sort((a,b)=>Number(a.current_stock)-Number(b.current_stock)),
   bestsellers:[...products.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,5).map(item=>({...item,quantity:item.quantity/1000})),activity:ledger.events.slice(-8).reverse(),recent_statuses:recent.data}});
 }catch(error){
  console.error("Error generando dashboard:",error);const message=error instanceof Error?error.message:"";const unauthorized=/^(Usuario|Rol|Acceso)/.test(message);
  return NextResponse.json({success:false,message:unauthorized?message:"No se pudo generar el dashboard."},{status:unauthorized?403:500});
 }
}
