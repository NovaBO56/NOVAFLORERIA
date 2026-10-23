import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentReportInstructions } from "@/components/public/payment-report-instructions";
import { PageHeader } from "@/components/ui/page-header";
import { dedicationDraftsSchema, dedicationsSchema } from "@/lib/public/dedications";
import { DedicationEditor } from "@/components/public/dedication-card";
import { addItem, sanitizeCart } from "@/lib/public/cart-logic";
import { orderPayload } from "@/lib/public/checkout";

const db = vi.hoisted(() => ({ select: vi.fn(), allowed: vi.fn() }));
vi.mock("@/lib/auth/permissions", () => ({ requireEmployeeOrAdmin: db.allowed }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ select: db.select }) }) }));
import { GET } from "@/app/api/admin/orders/[id]/route";
const id = "550e8400-e29b-41d4-a716-446655440000";
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("React", React); });

describe("QA30 corrections (unit/HTTP mocks; not real Auth or visual evidence)", () => {
  it.each([true, false])("COM30-001: WhatsApp available=%s has matching instructions", available => {
    const html = renderToStaticMarkup(<PaymentReportInstructions whatsappAvailable={available}/>);
    expect(html).toContain("El aviso no confirma el pago");
    expect(html.includes("pulsar Enviar")).toBe(available);
    if (!available) expect(html).toContain("Consulta aquí las novedades");
  });
  it("COM30-002: authenticated detail selects the persisted QR method and snapshot", async () => {
    const order = { id, total: 110, payments: [{ method: "qr", status: "confirmado", qr_slot: "qr_2", qr_label: "TEST QR 2" }] };
    db.select.mockReturnValue({ eq: () => ({ maybeSingle: async () => ({ data: order, error: null }) }) });
    const response = await GET(new Request("http://localhost/api/admin/orders/" + id), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(200);
    expect(db.allowed).toHaveBeenCalledOnce();
    expect(db.select.mock.calls[0][0]).toMatch(/payments\([^)]*method[^)]*qr_slot[^)]*qr_label/);
    expect((await response.json()).order.payments).toEqual(order.payments);
  });
  it("COM30-003: inventory's shared header stacks actions until wide desktop", () => {
    const html = renderToStaticMarkup(<PageHeader title="Inventario" description="Controla existencias, lotes, entradas, mermas, ajustes y movimientos." actions={<button>Registrar entrada</button>}/>);
    expect(html).toContain("2xl:flex-row"); expect(html).not.toContain('"lg:flex-row');
    expect(html).toContain("min-w-0 flex-1"); expect(html).toContain("flex-wrap items-center");
  });
});

describe("Card intention, cart reload and existing order storage", () => {
  const blank = { message: "", signature: "", intent: "blank" as const };
  const write = { message: "", signature: "", intent: "write" as const };
  const details = { customer_name: "TEST Cliente", customer_phone: "00012345", delivery: "retiro" as const, address: "", reference: "", notes: "Envoltura rosada; no escribir en la tarjeta", promotion_id: "" };
  const product = { id, name: "TEST con tarjeta", price: 70, image: null, dedication_card_quantity: 1 };
  it("blank keeps one physical card and price, but serializes no draft intention", () => {
    const cart = sanitizeCart(JSON.parse(JSON.stringify(addItem([], { ...product, dedications: [blank] }))));
    const payload = orderPayload(cart, details, "test-blank-card");
    expect(cart[0].dedication_card_quantity).toBe(1); expect(cart[0].price).toBe(70);
    expect(payload.items[0].dedications).toEqual([{ message: "", signature: "" }]);
    expect(payload.customer_message).toContain(details.notes);
    expect(payload.items[0].dedications?.[0].message).not.toContain("Envoltura");
  });
  it("empty writing survives draft reload but cannot create an order", () => {
    expect(dedicationDraftsSchema.safeParse([write]).success).toBe(true);
    const cart = sanitizeCart(JSON.parse(JSON.stringify(addItem([], { ...product, dedications: [write] }))));
    expect(cart[0].dedications?.[0].intent).toBe("write");
    expect(() => orderPayload(cart, details, "test-incomplete-card")).toThrow();
    expect(dedicationsSchema.safeParse([{ ...write, message: "  \n " }]).success).toBe(false);
  });
  it("writing preserves newlines and independent messages, stripping UI-only metadata", () => {
    expect(dedicationsSchema.parse([{ ...write, message: "Para ti\ncon cariño", signature: "TEST" }, blank])).toEqual([{ message: "Para ti\ncon cariño", signature: "TEST" }, { message: "", signature: "" }]);
    expect(dedicationsSchema.safeParse([{ ...blank, message: "Hidden text" }]).success).toBe(false);
  });
  it("blank hides message controls; writing makes the message required", () => {
    const render = (entries: typeof blank[] | typeof write[]) => renderToStaticMarkup(<DedicationEditor count={1} value={entries} onChange={() => {}}/>);
    expect(render([blank])).not.toContain("<textarea"); expect(render([blank])).toContain("tarjeta física en blanco");
    expect(render([write])).toContain("required"); expect(render([write])).toContain('aria-invalid="true"');
  });
});
