import { describe, expect, it } from "vitest";
import { rejectPaymentSchema, updatePaymentQrSchema } from "@/validations/payments";

describe("Validaciones de pagos (Zod real de producción)", () => {
  describe("rejectPaymentSchema", () => {
    it("acepta un motivo válido", () => {
      expect(rejectPaymentSchema.safeParse({ reason: "Comprobante ilegible" }).success).toBe(true);
    });

    it("rechaza motivo vacío", () => {
      expect(rejectPaymentSchema.safeParse({ reason: "" }).success).toBe(false);
    });

    it("rechaza si falta el campo reason", () => {
      expect(rejectPaymentSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("updatePaymentQrSchema", () => {
    it("acepta sin account_label", () => {
      expect(updatePaymentQrSchema.safeParse({}).success).toBe(true);
    });

    it("acepta un account_label válido", () => {
      expect(updatePaymentQrSchema.safeParse({ account_label: "Cuenta Nova Florería" }).success).toBe(true);
    });
  });
});