import { describe, expect, it } from "vitest";
import { checkoutStep, checkoutSessionKeys, clearCheckoutSession, readCheckoutDraft, saveCheckoutDraft, hasCheckoutDraft, orderPayload } from "@/lib/public/checkout";
import { whatsappLink } from "@/lib/public/format";
import { storeMapPreview } from "@/validations/store-location";
import { orderContact } from "@/lib/public/order-contact";
import { addItem } from "@/lib/public/cart-logic";

describe("checkout: confirmation survives status updates and recovery", () => {
  it("unreported payment stays at payment", () => expect(checkoutStep({ status: "pendiente_pago", total: 10, payment_status: null }, true, false)).toBe(2));
  it.each(["pendiente", "confirmado", "rechazado", "reembolsado"])("reported payment %s stays at confirmation", payment_status => expect(checkoutStep({ status: "pendiente_pago", total: 10, payment_status }, true, false)).toBe(3));
  it.each(["confirmado", "en_preparacion", "listo", "finalizado"])("order %s stays at confirmation without payment row", status => expect(checkoutStep({ status, total: 10, payment_status: null }, true, false)).toBe(3));
  it("recovery keeps the milestone while summary reloads", () => expect(checkoutStep(null, true, false, true)).toBe(3));
  it("free checkout goes directly to confirmation", () => expect(checkoutStep({ status: "confirmado", total: 0, payment_status: null }, true, false)).toBe(3));
});

describe("session draft and explicit new purchase", () => {
  const draft = { customer_name: "Prueba", customer_phone: "700", delivery: "entrega" as const, address: "Calle de prueba", reference: "Esquina", notes: "Tarjeta", promotion_id: "" };
  function storage() { const values = new Map<string,string>(); return { getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => { values.set(key,value); }, removeItem: (key:string) => { values.delete(key); } }; }
  it("delivery alone survives saving and reload", () => { const session=storage(); const initial={customer_name:"",customer_phone:"",delivery:"retiro" as const,address:"",reference:"",notes:"",promotion_id:""}; expect(hasCheckoutDraft(initial)).toBe(false); const changed={...initial,delivery:"entrega" as const}; if(hasCheckoutDraft(changed)) saveCheckoutDraft(session,changed); expect(readCheckoutDraft(session)).toEqual(changed); });
  it("incomplete pre-order draft survives a new read", () => { const session=storage(); saveCheckoutDraft(session,draft); expect(readCheckoutDraft(session)).toEqual(draft); });
  it("only allowlisted fields are persisted", () => { const session=storage(); saveCheckoutDraft(session,{ ...draft, password:"must not persist" } as typeof draft); expect(session.getItem(checkoutSessionKeys.draft)).not.toContain("password"); });
  it("new purchase clears draft, recovery and idempotency attempt, preserves unrelated session", () => { const session=storage(); for(const key of Object.values(checkoutSessionKeys)) session.setItem(key,"saved"); session.setItem("unrelated","keep"); clearCheckoutSession(session); for(const key of Object.values(checkoutSessionKeys)) expect(session.getItem(key)).toBeNull(); expect(session.getItem("unrelated")).toBe("keep"); });
  it("corrupt draft cannot break checkout", () => expect(readCheckoutDraft({getItem:()=>"{"})).toBeNull());
  it("address reference is included only for delivery", () => { const items=addItem([],{id:"550e8400-e29b-41d4-a716-446655440000",name:"Prueba",price:10,image:null}); const payload=orderPayload(items, { ...draft, customer_phone:"70001234" },"test"); expect(payload.customer_message).toContain("Referencia: Esquina"); expect(orderPayload(items, {...draft,customer_phone:"70001234",delivery:"retiro"},"test").customer_message).not.toContain("Esquina"); });
});

describe("configured WhatsApp destinations", () => {
  it.each(["70001234", "+59170001234", "59170001234", "+591 7000-1234"])("normalizes %s once", phone => expect(whatsappLink(phone,"Pedido #1")).toBe("https://wa.me/59170001234?text=Pedido%20%231"));
  it.each([null,"","59159170001234","invalid","7000123"])("invalid/unconfigured %s produces no link", phone => expect(whatsappLink(phone)).toBeNull());
});

describe("map preview", () => {
  it("uses HTTPS OSM and a visible marker from validated coordinates", () => { const url=new URL(storeMapPreview({latitude:-17.7,longitude:-63.1})!); expect(url.origin).toBe("https://www.openstreetmap.org"); expect(url.searchParams.get("marker")).toBe("-17.7,-63.1"); });
  it("zero coordinates remain valid", () => expect(storeMapPreview({latitude:0,longitude:0})).not.toBeNull());
  it.each([{},{latitude:"",longitude:""},{latitude:90.1,longitude:0},{latitude:0},{latitude:0,longitude:181},{latitude:0,longitude:0,maps_url:"javascript:alert(1)"}])("incomplete/invalid input %j has no iframe", value => expect(storeMapPreview(value)).toBeNull());
});

describe("guest contact presentation and receipt eligibility", () => {
  const guest={customer:null,guest_name:"Prueba",guest_phone:"70001234",guest_whatsapp:null,receipt_token:"opaque",payments:[]};
  it("shows guest identity without a manufactured customer ID",()=>expect(orderContact(guest).customer).toEqual({id:null,name:"Prueba",phone:"70001234",whatsapp:null}));
  it("does not expose receipt before confirmed payment",()=>expect(orderContact({...guest,payments:[{status:"pendiente",confirmed_at:null}]}).receipt_token).toBeNull());
  it("exposes receipt only after recorded confirmation",()=>expect(orderContact({...guest,payments:[{status:"confirmado",confirmed_at:"2026-10-08"}]}).receipt_token).toBe("opaque"));
});
