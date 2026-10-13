import { describe, expect, it } from "vitest";
import { salesTotals, type SalesEvent } from "@/lib/reports/sales-ledger";
import { publicOrderError } from "@/lib/public/order-error";
import { createSaleReturnSchema } from "@/validations/sale-returns";
import { createProductSchema } from "@/validations/products";
import { formatDateTime } from "@/lib/format";

const key="00000000-0000-4000-8000-000000000001";
function event(amount:number,kind:SalesEvent["kind"]="sale",occurred_at="2026-10-12T12:00:00Z"):SalesEvent {
 return {kind,event_id:key,order_id:key,order_number:1,order_type:"fisica",original_total:90,amount,occurred_at,payment_method:"efectivo",actor_id:key,actor_name:"TEST ADMIN",return_type:kind==="refund"?"reintegro":null,reason:null,order_status:"finalizado",customer_name:"TEST"};
}
describe("Fuente contable compartida (unitario; SQL/HTTP por separado)",()=>{
 it("Bs90 originales sin reintegro",()=>expect(salesTotals([event(90)],"2026-10-12","2026-10-12")).toMatchObject({gross_sales:90,refunds:0,net_sales:90}));
 it("Bs90 reintegrados mantienen bruto90/neto0",()=>expect(salesTotals([event(90),event(90,"refund")],"2026-10-12","2026-10-12")).toMatchObject({gross_sales:90,refunds:90,net_sales:0}));
 it("reintegro parcial200/50/neto150",()=>expect(salesTotals([event(200),event(50,"refund")],"2026-10-12","2026-10-12")).toMatchObject({gross_sales:200,refunds:50,net_sales:150}));
 it("300/50/neto250",()=>expect(salesTotals([event(100),event(200),event(50,"refund")],"2026-10-12","2026-10-12")).toMatchObject({gross_sales:300,refunds:50,net_sales:250}));
 it("reintegro de venta anterior puede producir neto negativo",()=>expect(salesTotals([event(50,"refund")],"2026-10-12","2026-10-12").net_sales).toBe(-50));
 it("centavos exactos",()=>expect(salesTotals([event(0.1),event(0.2),event(0.1,"refund")],"2026-10-12","2026-10-12").net_sales).toBe(0.2));
 it("UTC medianoche todavía pertenece al día comercial anterior",()=>{
  const totals=salesTotals([event(90,"sale","2026-10-13T03:59:59Z"),event(10,"refund","2026-10-13T04:00:00Z")],"2026-10-12","2026-10-13");
  expect(totals.series.map(day=>day.net_sales)).toEqual([90,-10]);
 });
 it("fecha visible de transacción usa Bolivia",()=>expect(formatDateTime("2026-10-13T02:30:00Z")).toContain("12/10/2026"));
 it("producto nuevo permanece inactivo hasta configurar receta",()=>expect(createProductSchema.parse({name:"TEST",price:90})).toMatchObject({is_active:false,is_available:false}));
});
describe("Retorno físico y dinero son contratos distintos",()=>{
 it("retorno físico permite cero",()=>expect(createSaleReturnSchema.safeParse({type:"retorno_fisico",amount:0,reason:"TEST",idempotency_key:key}).success).toBe(true));
 it.each(["reintegro","devolucion"])("%s exige dinero positivo",type=>expect(createSaleReturnSchema.safeParse({type,amount:0,reason:"TEST",idempotency_key:key}).success).toBe(false));
 it.each([0.001,Infinity,NaN,1e10])("rechaza monto %s",amount=>expect(createSaleReturnSchema.safeParse({type:"reintegro",amount,reason:"TEST",idempotency_key:key}).success).toBe(false));
 it("no admite reintegro sin clave de retry",()=>expect(createSaleReturnSchema.safeParse({type:"reintegro",amount:90,reason:"TEST"}).success).toBe(false));
 it("retorno físico no permite ocultar dinero",()=>expect(createSaleReturnSchema.safeParse({type:"retorno_fisico",amount:90,reason:"TEST",idempotency_key:key}).success).toBe(false));
});
describe("Errores públicos sin diagnósticos internos",()=>{
 it.each(["Stock insuficiente: solo hay 1.000 disponible y se necesitan 2.000.","Inconsistencia de inventario: UUID secreto","SQL table product_inventory_requirements failure"])("no entrega el diagnóstico %s",message=>{const result=publicOrderError(message);expect(result).not.toMatch(/1\.000|2\.000|UUID|SQL|product_inventory_requirements/);expect(result).not.toBe(message);});
 it("stock ofrece una acción comercial",()=>expect(publicOrderError("Stock insuficiente: item 1.000")).toContain("Reduce la cantidad"));
});
