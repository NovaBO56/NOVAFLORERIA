import { describe, expect, it } from "vitest";
import {
  createPromotionSchema,
  updatePromotionSchema,
  addPromotionProductSchema,
  updatePromotionProductSchema,
  updateCustomerSchema,
} from "@/validations/promotions";

describe("Validaciones de promociones y clientes", () => {
  describe("createPromotionSchema", () => {
    it("acepta una promoción válida por producto con porcentaje", () => {
      const result = createPromotionSchema.safeParse({
        name: "Descuento de temporada",
        promotion_type: "producto",
        discount_type: "porcentaje",
        discount_value: 15,
      });

      expect(result.success).toBe(true);
    });

    it("acepta una promoción válida por producto con monto fijo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Oferta especial",
        promotion_type: "producto",
        discount_type: "monto_fijo",
        discount_value: 20,
      });

      expect(result.success).toBe(true);
    });

    it("acepta una promoción combo con precio fijo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Combo San Valentín",
        promotion_type: "combo",
        combo_price: 250,
      });

      expect(result.success).toBe(true);
    });

    it("rechaza un promotion_type no válido", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "temporada",
        discount_type: "porcentaje",
        discount_value: 10,
      });

      expect(result.success).toBe(false);
    });

    it("rechaza discount_value negativo", () => {
      const result = createPromotionSchema.safeParse({
        name: "Promo",
        promotion_type: "producto",
        discount_type: "monto_fijo",
        discount_value: -5,
      });

      expect(result.success).toBe(false);
    });

    it("rechaza combo sin combo_price", () => {
      const result = createPromotionSchema.safeParse({
        name: "Combo sin precio",
        promotion_type: "combo",
      });

      expect(result.success).toBe(false);
    });

    it("rechaza nombre vacío", () => {
      const result = createPromotionSchema.safeParse({
        name: "",
        promotion_type: "producto",
        discount_type: "porcentaje",
        discount_value: 10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updatePromotionSchema", () => {
    it("acepta desactivar una promoción", () => {
      expect(
        updatePromotionSchema.safeParse({
          is_active: false,
        }).success,
      ).toBe(true);
    });

    it("acepta actualizar el precio de un combo", () => {
      expect(
        updatePromotionSchema.safeParse({
          combo_price: 250,
        }).success,
      ).toBe(true);
    });

    it("acepta actualizar un descuento de producto", () => {
      expect(
        updatePromotionSchema.safeParse({
          discount_type: "porcentaje",
          discount_value: 15,
        }).success,
      ).toBe(true);
    });

    it("rechaza un objeto vacío", () => {
      expect(
        updatePromotionSchema.safeParse({}).success,
      ).toBe(false);
    });
  });

  describe("addPromotionProductSchema", () => {
    const validId =
      "e71f5830-6516-45cd-968a-fe61ca62a524";

    it("acepta un product_id válido", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
        }).success,
      ).toBe(true);
    });

    it("acepta una cantidad válida", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 12,
        }).success,
      ).toBe(true);
    });

    it("rechaza un product_id inválido", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: "no-es-uuid",
        }).success,
      ).toBe(false);
    });

    it("rechaza una cantidad cero", () => {
      expect(
        addPromotionProductSchema.safeParse({
          product_id: validId,
          quantity: 0,
        }).success,
      ).toBe(false);
    });
  });

  describe("updatePromotionProductSchema", () => {
    it("acepta actualizar una cantidad válida", () => {
      expect(
        updatePromotionProductSchema.safeParse({
          quantity: 12,
        }).success,
      ).toBe(true);
    });

    it("rechaza una cantidad cero", () => {
      expect(
        updatePromotionProductSchema.safeParse({
          quantity: 0,
        }).success,
      ).toBe(false);
    });
  });

  describe("updateCustomerSchema", () => {
    it("acepta actualizar solo el nombre", () => {
      expect(
        updateCustomerSchema.safeParse({
          name: "María González Pérez",
        }).success,
      ).toBe(true);
    });

    it("rechaza un correo inválido", () => {
      expect(
        updateCustomerSchema.safeParse({
          email: "no-es-correo",
        }).success,
      ).toBe(false);
    });

    it("rechaza un objeto vacío", () => {
      expect(
        updateCustomerSchema.safeParse({}).success,
      ).toBe(false);
    });
  });
});