import { describe, expect, it } from "vitest";
import { createPhysicalSaleSchema, advanceOrderStatusSchema } from "@/validations/sales";

describe("Validaciones de ventas físicas (Zod real de producción)", () => {
  const validProductId = "e71f5830-6516-45cd-968a-fe61ca62a524";
  const validPromotionId = "93eca639-f2b5-4d91-9e43-9623fc8417d5";

  describe("createPhysicalSaleSchema", () => {
    it("acepta una venta válida mínima, sin descuento", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        payment_method: "efectivo",
      });
      expect(result.success).toBe(true);
    });

    it("acepta una venta con promoción", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        promotion_id: validPromotionId,
        payment_method: "qr",
      });
      expect(result.success).toBe(true);
    });

    it("acepta una venta con descuento manual y motivo", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        manual_discount_amount: 10,
        manual_discount_reason: "Cliente frecuente",
        payment_method: "efectivo",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza descuento manual SIN motivo", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        manual_discount_amount: 10,
        payment_method: "efectivo",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza usar promoción Y descuento manual al mismo tiempo", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        promotion_id: validPromotionId,
        manual_discount_amount: 10,
        manual_discount_reason: "Motivo",
        payment_method: "efectivo",
      });
      expect(result.success).toBe(false);
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

    it("rechaza monto de descuento manual negativo o cero", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        manual_discount_amount: -5,
        manual_discount_reason: "Motivo",
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

    it("acepta venta con customer_id válido", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        customer_id: "93eca639-f2b5-4d91-9e43-9623fc8417d5",
        payment_method: "efectivo",
      });
      expect(result.success).toBe(true);
    });

    it("acepta venta anónima sin customer_id", () => {
      const result = createPhysicalSaleSchema.safeParse({
        items: [{ product_id: validProductId, quantity: 1 }],
        payment_method: "efectivo",
      });
      expect(result.success).toBe(true);
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