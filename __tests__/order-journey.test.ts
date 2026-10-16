import { describe, expect, it } from "vitest";
import { orderJourney, orderGuide } from "@/lib/public/order-journey";
import type { PublicOrder } from "@/lib/public/types";
const base: PublicOrder = { id:"private-id",order_number:123,status:"pendiente_pago",subtotal:90,discount_total:0,total:90,customer_message:"Método: Retiro en tienda",created_at:"2026-10-15T12:00:00Z",reserved_until:null,payment_status:null,items:[],receipt_token:"private-receipt" };
describe("Customer journey reflects server states without invented transitions",()=>{
 it("pending is not confirmed",()=>expect(orderJourney(base)).toMatchObject({current:0,waiting:false}));
 it("reported is awaiting manual confirmation",()=>expect(orderJourney({...base,payment_status:"pendiente"})).toMatchObject({current:1,waiting:true}));
 for(const [status,current] of [["confirmado",2],["en_preparacion",3],["listo",4],["finalizado",5]] as const) it(status,()=>expect(orderJourney({...base,status,payment_status:"confirmado"}).current).toBe(current));
 for(const status of ["cancelado","rechazado"]) it(`no fabricated timeline for ${status}`,()=>expect(orderJourney({...base,status,payment_status:"pendiente"})).toMatchObject({stopped:true,current:-1,waiting:false}));
 it("rejected payment is stopped even if order is pending",()=>expect(orderJourney({...base,payment_status:"rechazado"}).stopped).toBe(true));
 it("pickup has ready for collection and collected",()=>expect(orderJourney(base).labels.slice(-2)).toEqual(["Listo para recoger","Retirado"]));
 it("delivery does not invent an en camino state",()=>expect(orderJourney({...base,customer_message:"Método: Entrega por coordinar\nTEST dirección"}).labels.slice(-2)).toEqual(["Listo para entregar","Entregado"]));
 it("free order has no fabricated payment stage",()=>{const journey=orderJourney({...base,total:0,status:"confirmado"});expect(journey.labels).not.toContain("Pago reportado");expect(journey.labels).not.toContain("Pago confirmado");expect(journey.current).toBe(1);});
 it("guide contains no receipt credential or order UUID",()=>{const guide=orderGuide(base);expect(guide).toContain("Pedido #123");expect(guide).toContain("celular");expect(guide).not.toContain(base.id);expect(guide).not.toContain(base.receipt_token);});
});
