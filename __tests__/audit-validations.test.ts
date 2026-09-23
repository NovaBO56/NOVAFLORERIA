import { describe, expect, it } from "vitest";
import { auditTrailQuerySchema } from "@/validations/audit";

describe("Validaciones de auditoría (Zod real de producción)", () => {
  it("acepta la petición sin parámetros y aplica los valores por defecto", () => {
    const result = auditTrailQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    }
  });

  it("acepta limit y offset explícitos (como llegan de searchParams, en texto)", () => {
    const result = auditTrailQuerySchema.safeParse({ limit: "50", offset: "20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(20);
    }
  });

  it("rechaza limit por encima de 200 (tope de la función get_audit_trail)", () => {
    const result = auditTrailQuerySchema.safeParse({ limit: "500" });
    expect(result.success).toBe(false);
  });

  it("rechaza limit en 0 o negativo", () => {
    expect(auditTrailQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(auditTrailQuerySchema.safeParse({ limit: "-5" }).success).toBe(false);
  });

  it("rechaza offset negativo", () => {
    const result = auditTrailQuerySchema.safeParse({ offset: "-1" });
    expect(result.success).toBe(false);
  });

  it("rechaza valores no numéricos", () => {
    const result = auditTrailQuerySchema.safeParse({ limit: "abc" });
    expect(result.success).toBe(false);
  });
});