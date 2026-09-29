import { describe, expect, it } from "vitest";
import { createOrderSchema, cancelOrderSchema } from "@/validations/orders";

describe("Validaciones de pedidos (Zod real de producción)", () => {
  const validProductId = "e71f5830-6516-45cd-968a-fe61ca62a524";
  const validOptionId = "b2c3d4e5-1234-4a5b-8c9d-0e1f2a3b4c5d";

  const baseOrder = {
    customer_name: "María González",
    customer_phone: "70011223",
    items: [{ product_id: validProductId, quantity: 1 }],
    idempotency_key: "test-key-001",
  };

  describe("createOrderSchema", () => {
    it("acepta un pedido válido mínimo", () => {
      expect(createOrderSchema.safeParse(baseOrder).success).toBe(true);
    });

    it("rechaza sin nombre de cliente", () => {
      const result = createOrderSchema.safeParse({ ...baseOrder, customer_name: "" });
      expect(result.success).toBe(false);
    });

    it("rechaza sin items", () => {
      const result = createOrderSchema.safeParse({ ...baseOrder, items: [] });
      expect(result.success).toBe(false);
    });

    it("rechaza cantidad negativa en un item", () => {
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [{ product_id: validProductId, quantity: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("rechaza product_id que no es UUID", () => {
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [{ product_id: "no-es-uuid", quantity: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("rechaza sin idempotency_key", () => {
      const result = createOrderSchema.safeParse({ ...baseOrder, idempotency_key: "" });
      expect(result.success).toBe(false);
    });

    it("rechaza teléfono demasiado corto", () => {
      const result = createOrderSchema.safeParse({ ...baseOrder, customer_phone: "123" });
      expect(result.success).toBe(false);
    });

    it("acepta opciones de personalización, mensaje y nota por item", () => {
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [
          {
            product_id: validProductId,
            quantity: 2,
            customization_option_ids: [validOptionId],
            message: "Feliz cumpleaños",
            note: "Sin tarjeta",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("usa [] como customization_option_ids por defecto si no se envía", () => {
      const result = createOrderSchema.safeParse(baseOrder);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].customization_option_ids).toEqual([]);
      }
    });

    it("rechaza un customization_option_id que no es UUID", () => {
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [{ product_id: validProductId, quantity: 1, customization_option_ids: ["no-es-uuid"] }],
      });
      expect(result.success).toBe(false);
    });

    it("ya no acepta el campo libre 'personalization' del contrato anterior", () => {
      // Zod ignora claves no declaradas: no rompe, pero tampoco hace nada con ese campo.
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [{ product_id: validProductId, quantity: 1, personalization: { color: "rojo" } }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect("personalization" in result.data.items[0]).toBe(false);
      }
    });
  });

  describe("cancelOrderSchema", () => {
    it("acepta un motivo válido", () => {
      expect(cancelOrderSchema.safeParse({ reason: "Cliente se arrepintió" }).success).toBe(true);
    });

    it("rechaza motivo vacío", () => {
      expect(cancelOrderSchema.safeParse({ reason: "" }).success).toBe(false);
    });
  });
});