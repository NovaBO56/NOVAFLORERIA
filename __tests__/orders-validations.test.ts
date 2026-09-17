import { describe, expect, it } from "vitest";
import { createOrderSchema, cancelOrderSchema } from "@/validations/orders";

describe("Validaciones de pedidos (Zod real de producción)", () => {
  const validProductId = "e71f5830-6516-45cd-968a-fe61ca62a524";

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

    it("acepta personalización, mensaje y nota por item", () => {
      const result = createOrderSchema.safeParse({
        ...baseOrder,
        items: [
          {
            product_id: validProductId,
            quantity: 2,
            personalization: { color: "rojo" },
            message: "Feliz cumpleaños",
            note: "Sin tarjeta",
          },
        ],
      });
      expect(result.success).toBe(true);
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