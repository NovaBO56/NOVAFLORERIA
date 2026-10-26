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

describe("Customer tracking schedule", () => {
 const scheduledFor = "2026-10-26T02:30:00Z";

 it.each([
  ["proposed", "Horario propuesto", "La florería propone este horario. Coordina con la tienda para confirmarlo."],
  ["confirmed", "Horario confirmado", "Este horario fue registrado por la florería como coordinado contigo."],
 ] as const)("shows the %s state with the correct customer guidance", (status, heading, guidance) => {
  const html = render({ scheduled_for: scheduledFor, schedule_status: status });
  expect(html).toContain(`<h3 class="font-bold">${heading}</h3>`);
  expect(html).toContain(guidance);
  expect(html).not.toContain(status === "proposed" ? "Horario confirmado" : "Horario propuesto");
 });

 it.each(["proposed", "confirmed"] as const)("shows %s dates in Bolivia even when UTC is on the next day", status => {
  const html = render({ scheduled_for: scheduledFor, schedule_status: status });
  expect(html).toContain(`<time dateTime="${scheduledFor}">`);
  expect(html).toContain("25 de octubre de 2026");
  expect(html).toMatch(/(?:10:30 p\. m\.|22:30)/);
  expect(html).toContain("Hora de Bolivia");
  expect(html).not.toContain("26 de octubre de 2026");
  expect(html).not.toContain("02:30</time>");
 });

 it.each(["pendiente_pago", "confirmado", "en_preparacion", "listo"])("keeps an unscheduled %s order pending coordination", status => {
  const html = render({ status, scheduled_for: null, schedule_status: "pending" });
  expect(html).toContain("Horario por coordinar");
  expect(html).toContain("La florería coordinará contigo la fecha y hora de recojo.");
  expect(html).not.toContain("Horario propuesto");
  expect(html).not.toContain("Horario confirmado");
  expect(html).not.toContain("<time ");
 });

 it.each(["finalizado", "cancelado", "rechazado"])("does not promise future coordination for unscheduled %s orders", status => {
  const html = render({ status, scheduled_for: null, schedule_status: "pending" });
  expect(html).toContain("Sin horario registrado");
  expect(html).toContain("Este pedido no tiene una fecha y hora programadas registradas.");
  expect(html).not.toContain("La florería coordinará contigo");
  expect(html).not.toContain("<time ");
 });

 it("uses the client presentation without administration controls", () => {
  const html = render({ scheduled_for: scheduledFor, schedule_status: "confirmed" });
  expect(html).toContain('class="customer-card customer-stack"');
  expect(html).toContain('class="customer-note" aria-label="Horario del pedido"');
  expect(html).not.toContain("admin-order-dialog");
  expect(html).not.toContain("order-schedule-time");
  expect(html).not.toContain("Programar horario");
  expect(html).not.toContain("Cambiar horario");
  expect(html).not.toContain("Guardar horario");
 });
});
