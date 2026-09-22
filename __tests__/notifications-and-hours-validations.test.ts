import { describe, expect, it } from "vitest";
import {
  updateBusinessHoursSchema,
  updateAcceptOrdersOutsideHoursSchema,
} from "@/validations/notifications-and-hours";

describe("Validaciones de notificaciones y horarios (Zod real de producción)", () => {
  describe("updateBusinessHoursSchema", () => {
    it("acepta un horario válido", () => {
      const result = updateBusinessHoursSchema.safeParse({ opens_at: "08:00", closes_at: "20:00" });
      expect(result.success).toBe(true);
    });

    it("acepta marcar el día como cerrado", () => {
      expect(updateBusinessHoursSchema.safeParse({ is_closed: true }).success).toBe(true);
    });

    it("rechaza apertura después del cierre", () => {
      const result = updateBusinessHoursSchema.safeParse({ opens_at: "21:00", closes_at: "08:00" });
      expect(result.success).toBe(false);
    });

    it("rechaza formato de hora inválido", () => {
      const result = updateBusinessHoursSchema.safeParse({ opens_at: "8am", closes_at: "20:00" });
      expect(result.success).toBe(false);
    });

    it("rechaza un objeto vacío", () => {
      expect(updateBusinessHoursSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("updateAcceptOrdersOutsideHoursSchema", () => {
    it("acepta true", () => {
      expect(updateAcceptOrdersOutsideHoursSchema.safeParse({ enabled: true }).success).toBe(true);
    });

    it("acepta false", () => {
      expect(updateAcceptOrdersOutsideHoursSchema.safeParse({ enabled: false }).success).toBe(true);
    });

    it("rechaza un valor no booleano", () => {
      expect(updateAcceptOrdersOutsideHoursSchema.safeParse({ enabled: "si" }).success).toBe(false);
    });
  });
});