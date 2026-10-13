import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CheckoutPayment } from "@/components/public/checkout-payment";
import type { PaymentQr } from "@/lib/public/payment-qrs";
const qrs:PaymentQr[]=[{qr_slot:"qr_1",account_label:"TEST PRINCIPAL",qr_public_url:"http://127.0.0.1:60621/storage/v1/object/public/payment-qr/test1.png"},{qr_slot:"qr_2",account_label:"TEST SEGUNDO",qr_public_url:"http://127.0.0.1:60621/storage/v1/object/public/payment-qr/test2.png"}];
const defaults={total:90,qrs,selected:null,error:"",busy:false,reported:false,whatsappAvailable:true,onSelect:()=>{},onReport:()=>{}};
describe("Checkout payment markup (not browser/layout evidence)",()=>{
 it("two QR configured labels and instructions",()=>{const html=renderToStaticMarkup(createElement(CheckoutPayment,defaults));expect(html).toContain("Total a pagar");expect(html.match(/type="radio"/g)).toHaveLength(2);expect(html).toContain("TEST PRINCIPAL");expect(html).toContain("TEST SEGUNDO");expect(html).toContain("Realiza el pago por el total exacto");expect(html).toContain("Envíalo para avisarnos");});
 it("cannot report without a selection",()=>expect(renderToStaticMarkup(createElement(CheckoutPayment,defaults))).toMatch(/<button[^>]*disabled=""[^>]*>Ya pagué<\/button>/));
 it("reported snapshot shows one locked QR, no new report button",()=>{const html=renderToStaticMarkup(createElement(CheckoutPayment,{...defaults,selected:qrs[1],reported:true}));expect(html).toContain("QR utilizado en tu aviso");expect(html.match(/type="radio"/g)).toHaveLength(1);expect(html).not.toContain("TEST PRINCIPAL");expect(html).not.toContain("Ya pagué");expect(html).not.toContain("Pago confirmado");});
 it("zero QR safe configuration message",()=>{const html=renderToStaticMarkup(createElement(CheckoutPayment,{...defaults,qrs:[],error:"No hay cuentas de pago configuradas"}));expect(html).toContain("No hay cuentas de pago configuradas");expect(html).toMatch(/<button[^>]*disabled/);});
 it("missing WhatsApp does not promise it will open",()=>{const html=renderToStaticMarkup(createElement(CheckoutPayment,{...defaults,selected:qrs[0],whatsappAvailable:false}));expect(html).toContain("WhatsApp no está disponible");expect(html).not.toContain("Se abrirá WhatsApp");});
 it("busy report remains disabled",()=>expect(renderToStaticMarkup(createElement(CheckoutPayment,{...defaults,selected:qrs[0],busy:true}))).toMatch(/<button[^>]*disabled=""[^>]*>Registrando aviso…<\/button>/));
});
