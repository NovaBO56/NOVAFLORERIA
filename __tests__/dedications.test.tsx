import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DedicationEditor, DedicationPreview } from "@/components/public/dedication-card";
import { dedicationsSchema, resizeDedications } from "@/lib/public/dedications";
import { addItem, changeItemQuantity, sanitizeCart, cartTotal } from "@/lib/public/cart-logic";
import { orderPayload } from "@/lib/public/checkout";
import { createInventoryItemSchema } from "@/validations/inventory";

const dedication = { message: "Para ti, con cariño.\n¡Que tengas un día hermoso!", signature: "Familia de prueba" };
const product = { id: "00000000-0000-4000-8000-000000000001", name: "TEST ramo con tarjeta", price: 120, image: null, dedication_card_quantity: 1, dedications: [dedication] };
describe("Dedicatorias conectadas al carrito y checkout (unitario, no permisos reales)", () => {
  it("sin tarjeta no presenta campos ni preview", () => {
    expect(renderToStaticMarkup(<DedicationEditor count={0} value={[]} onChange={() => {}}/>)).toBe("");
  });
  it("tarjeta incluye límites, firma, contador y preview lavanda accesible", () => {
    const html = renderToStaticMarkup(<DedicationEditor count={1} value={[dedication]} onChange={() => {}}/>);
    expect(html).toContain("Una dedicatoria especial");
    expect(html).toContain('maxLength="250"');
    expect(html).toContain('maxLength="60"');
    expect(html).toContain("#f6f0fa");
    expect(html).toContain(dedication.signature);
  });
  it.each([250, 251])("límite de mensaje %i", length => expect(dedicationsSchema.safeParse([{ message: "a".repeat(length), signature: "" }]).success).toBe(length === 250));
  it.each([60, 61])("límite de firma %i", length => expect(dedicationsSchema.safeParse([{ message: "", signature: "a".repeat(length) }]).success).toBe(length === 60));
  it("firma y texto se escapan, conservando saltos; no HTML ejecutable", () => {
    const html = renderToStaticMarkup(<DedicationPreview entries={[{ message: '<script>alert("x")</script>\nOtra línea', signature: "<img src=x>" }]}/>);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("\nOtra línea");
  });
  it("no duplica una dedicatoria al subir cantidad", () => {
    const initial = addItem([], product);
    const changed = changeItemQuantity(initial, initial[0].id, 1);
    expect(changed[0].dedications).toEqual([dedication, { message: "", signature: "" }]);
  });
  it("dos compras personalizadas idénticas mantienen líneas independientes", () => {
    const cart = addItem(addItem([], product), product);
    expect(cart).toHaveLength(2);
    expect(cart[0].id).not.toBe(cart[1].id);
  });
  it("personalización funciona sin randomUUID en HTTP local por Wi-Fi", () => {
    const nativeCrypto = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: nativeCrypto.getRandomValues.bind(nativeCrypto) });
    try {
      const lines = Array.from({ length: 10 }, () => addItem([], product)[0]);
      expect(new Set(lines.map(line => line.id)).size).toBe(10);
      expect(lines.every(line => line.dedications?.[0].message === dedication.message)).toBe(true);
    } finally { vi.unstubAllGlobals(); }
  });
  it("recarga y payload conservan exactamente mensaje y firma por componente", () => {
    const cart = sanitizeCart(JSON.parse(JSON.stringify(addItem([], product))));
    const payload = orderPayload(cart, { customer_name: "TEST Cliente", customer_phone: "00012345", delivery: "retiro", address: "", notes: "", promotion_id: "" }, "test-dedications");
    expect(payload.items[0].dedications).toEqual([dedication]);
    expect(payload.items[0].message).toBeNull();
    expect(payload.items[0].product_id).toBe(product.id);
  });
  it("dos tarjetas por unidad se representan explícitamente", () => {
    expect(resizeDedications([dedication], 4)).toEqual([dedication, ...Array.from({ length: 3 }, () => ({ message: "", signature: "" }))]);
  });
  it("clasificación se guarda explícitamente, no por nombre", () => {
    expect(createInventoryItemSchema.parse({ name: "Papel con nombre Tarjeta", item_type: "insumo" }).is_dedication_card).toBe(false);
    expect(createInventoryItemSchema.parse({ name: "SKU arbitrario", item_type: "insumo", is_dedication_card: true }).is_dedication_card).toBe(true);
  });
  it("una flor no puede clasificarse como tarjeta", () => {
    expect(createInventoryItemSchema.safeParse({ name: "Rosa", item_type: "flor", is_dedication_card: true }).success).toBe(false);
  });
  it("muchas tarjetas explican el límite sin replicar ni inventar mensajes", () => {
    const html = renderToStaticMarkup(<DedicationEditor count={199} value={[dedication]} onChange={() => {}}/>);
    expect(html).toContain("198 tarjetas por línea");
    expect(html).toContain("Quitar los mensajes");
    expect(html).not.toContain("<textarea");
  });
  it.each([1, 5, 10, 20, 30])("carrito persistido con %i líneas y dedicatorias conserva total/payload", count => {
    let cart = addItem([], product);
    for (let index = 1; index < count; index++) cart = addItem(cart, { ...product, id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, dedications: [{ ...dedication, message: `Tarjeta ${index}` }] });
    cart = sanitizeCart(JSON.parse(JSON.stringify(cart)));
    const payload = orderPayload(cart, { customer_name: "TEST Cliente", customer_phone: "00012345", delivery: "retiro", address: "", notes: "", promotion_id: "" }, `test-cart-${count}`);
    expect(cart).toHaveLength(count);
    expect(cartTotal(cart)).toBe(count * 120);
    expect(payload.items).toHaveLength(count);
    expect(payload.items.every(item => item.dedications?.length === 1)).toBe(true);
  });
});
