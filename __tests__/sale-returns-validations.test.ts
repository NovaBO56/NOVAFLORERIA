import { describe, expect, it } from "vitest";
import {
  createSaleReturnSchema,
  requestOrderDeletionSchema,
  reviewDeletionRequestSchema,
} from "@/validations/sale-returns";

describe("Validaciones de devoluciones y eliminación (Zod real de producción)", () => {
  describe("createSaleReturnSchema", () => {
    it("acepta una devolución válida", () => {
      expect(
        createSaleReturnSchema.safeParse({ type: "devolucion", amount: 40, reason: "Producto dañado" }).success,
      ).toBe(true);
    });

    it("acepta un reintegro válido", () => {
      expect(
        createSaleReturnSchema.safeParse({ type: "reintegro", amount: 10, reason: "Descuento por error" }).success,
      ).toBe(true);
    });

    it("rechaza un tipo no válido", () => {
      expect(
        createSaleReturnSchema.safeParse({ type: "otro", amount: 10, reason: "Motivo" }).success,
      ).toBe(false);
    });

    it("rechaza monto cero o negativo", () => {
      expect(createSaleReturnSchema.safeParse({ type: "reintegro", amount: 0, reason: "Motivo" }).success).toBe(false);
      expect(createSaleReturnSchema.safeParse({ type: "reintegro", amount: -5, reason: "Motivo" }).success).toBe(false);
    });

    it("rechaza sin motivo", () => {
      expect(createSaleReturnSchema.safeParse({ type: "reintegro", amount: 10, reason: "" }).success).toBe(false);
    });
  });

  describe("requestOrderDeletionSchema", () => {
    it("acepta un motivo válido", () => {
      expect(requestOrderDeletionSchema.safeParse({ reason: "Pedido de prueba duplicado" }).success).toBe(true);
    });

    it("rechaza sin motivo", () => {
      expect(requestOrderDeletionSchema.safeParse({ reason: "" }).success).toBe(false);
    });
  });

  describe("reviewDeletionRequestSchema", () => {
    it("acepta aprobación con motivo", () => {
      expect(
        reviewDeletionRequestSchema.safeParse({ approve: true, review_reason: "Confirmado, se puede borrar" }).success,
      ).toBe(true);
    });

    it("acepta rechazo con motivo", () => {
      expect(
        reviewDeletionRequestSchema.safeParse({ approve: false, review_reason: "No corresponde eliminarlo" }).success,
      ).toBe(true);
    });

    it("rechaza sin motivo de revisión", () => {
      expect(reviewDeletionRequestSchema.safeParse({ approve: true, review_reason: "" }).success).toBe(false);
    });
  });
});