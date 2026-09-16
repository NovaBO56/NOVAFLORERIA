import { describe, expect, it } from "vitest";
import {
  addRequirementSchema,
  updateRequirementSchema,
  createCustomizationOptionSchema,
  updateCustomizationOptionSchema,
} from "@/validations/product-recipe";

describe("Validaciones de receta de productos (Zod real de producción)", () => {
  const validItemId = "32563ff9-ecba-4e8e-b617-98e0f4a736bd";

  describe("addRequirementSchema", () => {
    it("acepta un ingrediente válido", () => {
      const result = addRequirementSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 2,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza cantidad cero", () => {
      const result = addRequirementSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza cantidad negativa", () => {
      const result = addRequirementSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza un inventory_item_id que no es UUID", () => {
      const result = addRequirementSchema.safeParse({
        inventory_item_id: "no-es-uuid",
        quantity: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateRequirementSchema", () => {
    it("acepta una cantidad nueva válida", () => {
      expect(updateRequirementSchema.safeParse({ quantity: 5 }).success).toBe(true);
    });

    it("rechaza cantidad negativa", () => {
      expect(updateRequirementSchema.safeParse({ quantity: -5 }).success).toBe(false);
    });
  });

  describe("createCustomizationOptionSchema", () => {
    it("acepta una opción válida", () => {
      const result = createCustomizationOptionSchema.safeParse({
        option_type: "color",
        name: "Rojo",
        extra_price: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza un option_type inválido", () => {
      const result = createCustomizationOptionSchema.safeParse({
        option_type: "sabor",
        name: "Vainilla",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza nombre vacío", () => {
      const result = createCustomizationOptionSchema.safeParse({
        option_type: "color",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza precio extra negativo", () => {
      const result = createCustomizationOptionSchema.safeParse({
        option_type: "color",
        name: "Rojo",
        extra_price: -1,
      });
      expect(result.success).toBe(false);
    });

    it("acepta sin extra_price (usa el default 0)", () => {
      const result = createCustomizationOptionSchema.safeParse({
        option_type: "oso",
        name: "Oso mediano",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.extra_price).toBe(0);
      }
    });
  });

  describe("updateCustomizationOptionSchema", () => {
    it("acepta actualizar solo is_active", () => {
      expect(updateCustomizationOptionSchema.safeParse({ is_active: false }).success).toBe(true);
    });

    it("rechaza un objeto vacío", () => {
      expect(updateCustomizationOptionSchema.safeParse({}).success).toBe(false);
    });
  });
});