import { describe, expect, it } from "vitest";
import {
  openCashSessionSchema,
  closeCashSessionSchema,
  recordCashMovementSchema,
} from "@/validations/cash-register";

describe("Validaciones de caja (Zod real de producción)", () => {
  const validRegisterId = "93eca639-f2b5-4d91-9e43-9623fc8417d5";

  describe("openCashSessionSchema", () => {
    it("acepta apertura válida", () => {
      expect(
        openCashSessionSchema.safeParse({ cash_register_id: validRegisterId, opening_amount: 100 }).success,
      ).toBe(true);
    });

    it("rechaza monto de apertura negativo", () => {
      expect(
        openCashSessionSchema.safeParse({ cash_register_id: validRegisterId, opening_amount: -10 }).success,
      ).toBe(false);
    });
  });

  describe("closeCashSessionSchema", () => {
    it("acepta cierre válido", () => {
      expect(closeCashSessionSchema.safeParse({ counted_amount: 250 }).success).toBe(true);
    });

    it("rechaza monto contado negativo", () => {
      expect(closeCashSessionSchema.safeParse({ counted_amount: -5 }).success).toBe(false);
    });
  });

  describe("recordCashMovementSchema", () => {
    it("acepta un gasto con motivo", () => {
      expect(
        recordCashMovementSchema.safeParse({ movement_type: "gasto", amount: 20, reason: "Compra de cinta" })
          .success,
      ).toBe(true);
    });

    it("rechaza un gasto sin motivo", () => {
      expect(recordCashMovementSchema.safeParse({ movement_type: "gasto", amount: 20 }).success).toBe(false);
    });

    it("acepta un ingreso sin motivo (opcional)", () => {
      expect(recordCashMovementSchema.safeParse({ movement_type: "ingreso", amount: 50 }).success).toBe(true);
    });

    it("acepta un ajuste con dirección y motivo", () => {
      expect(
        recordCashMovementSchema.safeParse({
          movement_type: "ajuste",
          amount: 5,
          direction: "entrada",
          reason: "Dinero encontrado de más",
        }).success,
      ).toBe(true);
    });

    it("rechaza un ajuste sin dirección", () => {
      expect(
        recordCashMovementSchema.safeParse({ movement_type: "ajuste", amount: 5, reason: "Motivo" }).success,
      ).toBe(false);
    });

    it("rechaza dirección en un tipo que no es ajuste", () => {
      expect(
        recordCashMovementSchema.safeParse({
          movement_type: "ingreso",
          amount: 5,
          direction: "entrada",
        }).success,
      ).toBe(false);
    });

    it("rechaza monto cero o negativo", () => {
      expect(recordCashMovementSchema.safeParse({ movement_type: "ingreso", amount: 0 }).success).toBe(false);
    });
  });
});