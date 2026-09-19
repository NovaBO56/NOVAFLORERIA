import { describe, expect, it } from "vitest";
import { createPhysicalSaleSchema, advanceOrderStatusSchema } from "@/validations/sales";

describe("Validaciones de ventas físicas (Zod real de producción)", () => {
  const validProductId = "e71f5830-6516-45cd-968a-fe61ca62a524";

  describe("createPhysicalSaleSchema", () => {
    it("acepta una venta válida mínima", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        payment_method: "efectivo",
      });
      expect(result.success).toBe(true);
    });

    it("usa 0 como descuento por defecto si no se envía", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        payment_method: "qr",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discount_total).toBe(0);
      }
    });

    it("rechaza sin items", () => {
      const result = createPhysicalSaleSchema.safeParse({ items: [], payment_method: "efectivo" });
      expect(result.success).toBe(false);
    });

    it("rechaza un método de pago no soportado en venta física", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        payment_method: "otro",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza descuento negativo", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        discount_total: -5,
        payment_method: "efectivo",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza cantidad cero", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 0 }],
        payment_method: "efectivo",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("advanceOrderStatusSchema", () => {
    it("acepta 'en_preparacion'", () => {
      expect(advanceOrderStatusSchema.safeParse({ new_status: "en_preparacion" }).success).toBe(true);
    });

    it("rechaza un estado no permitido en esta transición (ej. pendiente_pago)", () => {
      expect(advanceOrderStatusSchema.safeParse({ new_status: "pendiente_pago" }).success).toBe(false);
    });

    it("rechaza un estado inventado", () => {
      expect(advanceOrderStatusSchema.safeParse({ new_status: "en_camino" }).success).toBe(false);
    });
  });
});