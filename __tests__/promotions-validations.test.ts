import { describe, expect, it } from "vitest";
import {
  createPromotionSchema,
  updatePromotionSchema,
  addPromotionProductSchema,
  addPromotionCustomerSchema,
  updateCustomerSchema,
} from "@/validations/promotions";

describe("Validaciones de promociones y clientes (Zod real de producción)", () => {
  describe("createPromotionSchema", () => {
    it("acepta una promoción válida de porcentaje", () => {
      const result = createPromotionSchema.safeParse({
        name: "Descuento de temporada",
        promotion_type: "temporada",
        discount_type: "porcentaje",
        discount_value: 15,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza un promotion_type no válido", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "navidad",
        discount_type: "porcentaje",
        discount_value: 10,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza discount_value negativo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "descuento",
        discount_type: "monto_fijo",
        discount_value: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza nombre vacío", () => {
      const result = createPromotionSchema.safeParse({
        name: "",
        promotion_type: "descuento",
        discount_type: "porcentaje",
        discount_value: 10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePromotionSchema", () => {
    it("acepta desactivar una promoción", () => {
      expect(updatePromotionSchema.safeParse({ is_active: false }).success).toBe(true);
    });

    it("rechaza un objeto vacío", () => {
      expect(updatePromotionSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("addPromotionProductSchema / addPromotionCustomerSchema", () => {
    const validId = "e71f5830-6516-45cd-968a-fe61ca62a524";

    it("acepta un product_id válido", () => {
      expect(addPromotionProductSchema.safeParse({ product_id: validId }).success).toBe(true);
    });

    it("rechaza un product_id inválido", () => {
      expect(addPromotionProductSchema.safeParse({ product_id: "no-es-uuid" }).success).toBe(false);
    });

    it("acepta un customer_id válido", () => {
      expect(addPromotionCustomerSchema.safeParse({ customer_id: validId }).success).toBe(true);
    });
  });

  describe("updateCustomerSchema", () => {
    it("acepta actualizar solo el nombre", () => {
      expect(updateCustomerSchema.safeParse({ name: "María González Pérez" }).success).toBe(true);
    });

    it("rechaza un correo inválido", () => {
      expect(updateCustomerSchema.safeParse({ email: "no-es-correo" }).success).toBe(false);
    });

    it("rechaza un objeto vacío", () => {
      expect(updateCustomerSchema.safeParse({}).success).toBe(false);
    });
  });
});