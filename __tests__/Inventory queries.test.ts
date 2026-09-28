import { describe, expect, it } from "vitest";
import { listLotsQuerySchema, listMovementsQuerySchema } from "@/validations/inventory-queries";

const validItemId = "e71f5830-6516-45cd-968a-fe61ca62a524";

describe("Filtros de consulta de inventario (Zod real de producción)", () => {
  describe("listLotsQuerySchema", () => {
    it("sin filtros: solo lotes con saldo y límite 100", () => {
      const result = listLotsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.only_available).toBe("true");
        expect(result.data.limit).toBe(100);
      }
    });

    it("acepta un ítem válido y only_available=false", () => {
      const result = listLotsQuerySchema.safeParse({ inventory_item_id: validItemId, only_available: "false" });
      expect(result.success).toBe(true);
    });

    it("rechaza un inventory_item_id que no es uuid", () => {
      expect(listLotsQuerySchema.safeParse({ inventory_item_id: "abc" }).success).toBe(false);
    });

    it("rechaza only_available con un valor inventado", () => {
      expect(listLotsQuerySchema.safeParse({ only_available: "si" }).success).toBe(false);
    });

    it("rechaza un límite mayor a 500", () => {
      expect(listLotsQuerySchema.safeParse({ limit: "501" }).success).toBe(false);
    });
  });

  describe("listMovementsQuerySchema", () => {
    it("usa límite 50 y offset 0 por defecto", () => {
      const result = listMovementsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("convierte limit y offset desde texto (así llegan en la URL)", () => {
      const result = listMovementsQuerySchema.safeParse({ limit: "20", offset: "40" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(40);
      }
    });

    it("acepta cada tipo de movimiento real del sistema", () => {
      for (const type of ["entrada", "salida", "merma", "ajuste", "devolucion", "reversion"]) {
        expect(listMovementsQuerySchema.safeParse({ movement_type: type }).success).toBe(true);
      }
    });

    it("rechaza un tipo de movimiento inventado", () => {
      expect(listMovementsQuerySchema.safeParse({ movement_type: "robo" }).success).toBe(false);
    });

    it("rechaza límite mayor a 200, límite 0 y offset negativo", () => {
      expect(listMovementsQuerySchema.safeParse({ limit: "201" }).success).toBe(false);
      expect(listMovementsQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
      expect(listMovementsQuerySchema.safeParse({ offset: "-1" }).success).toBe(false);
    });
  });
});