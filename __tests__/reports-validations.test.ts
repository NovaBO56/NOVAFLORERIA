import { describe, expect, it } from "vitest";
import { salesReportQuerySchema } from "@/validations/reports";

describe("Validaciones de reportes (Zod real de producción)", () => {
  it("acepta un rango de fechas válido", () => {
    expect(salesReportQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-20" }).success).toBe(true);
  });

  it("usa 'json' como formato por defecto", () => {
    const result = salesReportQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-20" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("json");
    }
  });

  it("acepta format=pdf explícito", () => {
    expect(
      salesReportQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-20", format: "pdf" }).success,
    ).toBe(true);
  });

  it("rechaza una fecha con formato inválido", () => {
    expect(salesReportQuerySchema.safeParse({ from: "01-09-2026", to: "2026-09-20" }).success).toBe(false);
  });

  it("rechaza cuando 'from' es posterior a 'to'", () => {
    expect(salesReportQuerySchema.safeParse({ from: "2026-09-20", to: "2026-09-01" }).success).toBe(false);
  });

  it("rechaza un formato no soportado", () => {
    expect(
      salesReportQuerySchema.safeParse({ from: "2026-09-01", to: "2026-09-20", format: "excel" }).success,
    ).toBe(false);
  });
});