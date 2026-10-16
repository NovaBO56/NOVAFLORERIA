import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/public/customer-shell", () => ({ WaitingFlower: () => createElement("span", { "data-waiting": true }) }));
import { OrderSummary } from "@/components/public/order-summary";
import type { PublicOrder } from "@/lib/public/types";
const order:PublicOrder={id:"test",order_number:10,status:"pendiente_pago",payment_status:"pendiente",total:90,subtotal:90,discount_total:0,customer_message:"Método: Retiro en tienda",created_at:"2026-10-15T12:00:00Z",reserved_until:null,items:[]};
const render=(changes:Partial<PublicOrder>={})=>renderToStaticMarkup(createElement(OrderSummary,{order:{...order,...changes}}));
describe("Customer order summary (markup only, not visual evidence)",()=>{
 it("reported waits and does not offer a premature receipt",()=>{const html=render();expect(html).toContain("Esperando confirmación");expect(html).toContain("El comprobante estará disponible");expect(html).not.toContain("/api/orders/receipt/");});
 it("confirmed receipt uses only the existing server credential",()=>{const html=render({status:"confirmado",payment_status:"confirmado",receipt_token:"test-receipt"});expect(html).toContain("Descargar comprobante PDF");expect(html).toContain("/api/orders/receipt/test-receipt");expect(html).not.toContain("Esperando confirmación");});
 it("rejection never presents intermediate stages as completed",()=>{const html=render({status:"rechazado",payment_status:"rechazado"});expect(html).not.toContain('aria-label="Estado de tu pedido"');expect(html).not.toContain("Etapa completada");expect(html).not.toContain("data-waiting");});
 it("free order does not imply a reported payment",()=>{const html=render({status:"confirmado",payment_status:null,total:0});expect(html).toContain("pedido gratuito");expect(html).not.toContain("Pago reportado");expect(html).not.toContain("El comprobante estará disponible");});
 it("completed pickup is clearly collected",()=>expect(render({status:"finalizado",payment_status:"confirmado"})).toContain("Retirado"));
 it("pickup ready uses pickup wording in both status and timeline",()=>{const html=render({status:"listo",payment_status:"confirmado"});expect(html).toContain("Listo para recoger");expect(html).not.toContain("Listo para entregar");});
 it("unknown historical delivery method is not invented",()=>expect(render({customer_message:null})).toContain("Entrega o recojo por coordinar"));
});
