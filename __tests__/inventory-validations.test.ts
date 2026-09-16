import { describe, expect, it } from "vitest";
import {
  createInventoryItemSchema,
  createInventoryEntrySchema,
  createInventoryWasteSchema,
  createInventoryAdjustmentSchema,
} from "@/validations/inventory";

describe("Validaciones de inventario (Zod real de producción)", () => {
  describe("createInventoryItemSchema", () => {
    it("acepta un ítem válido", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "Rosa roja",
        item_type: "flor",
        minimum_stock: 20,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza un tipo de ítem inválido", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "Rosa roja",
        item_type: "otra-cosa",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza nombre vacío", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "",
        item_type: "flor",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza stock mínimo negativo", () => {
      const result = createInventoryItemSchema.safeParse({
        name: "Rosa roja",
        item_type: "flor",
        minimum_stock: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createInventoryEntrySchema", () => {
    const validItemId = "93eca639-f2b5-4d91-9e43-9623fc8417d5";

    it("acepta una entrada válida", () => {
      const result = createInventoryEntrySchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 50,
      });
      expect(result.success).toBe(true);
    });

    it("rechaza cantidad negativa", () => {
      const result = createInventoryEntrySchema.safeParse({
        inventory_item_id: validItemId,
        quantity: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza cantidad cero", () => {
      const result = createInventoryEntrySchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rechaza un inventory_item_id que no es UUID", () => {
      const result = createInventoryEntrySchema.safeParse({
        inventory_item_id: "no-es-un-uuid",
        quantity: 10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createInventoryWasteSchema", () => {
    const validItemId = "93eca639-f2b5-4d91-9e43-9623fc8417d5";

    it("acepta una merma válida sin lote específico", () => {
      const result = createInventoryWasteSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 10,
        reason: "Flores marchitas",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza motivo vacío", () => {
      const result = createInventoryWasteSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: 10,
        reason: "",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza cantidad negativa", () => {
      const result = createInventoryWasteSchema.safeParse({
        inventory_item_id: validItemId,
        quantity: -10,
        reason: "Motivo válido",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createInventoryAdjustmentSchema", () => {
    const validItemId = "93eca639-f2b5-4d91-9e43-9623fc8417d5";

    it("acepta un ajuste positivo con motivo", () => {
      const result = createInventoryAdjustmentSchema.safeParse({
        inventory_item_id: validItemId,
        quantity_delta: 5,
        reason: "Conteo físico encontró unidades de más",
      });
      expect(result.success).toBe(true);
    });

    it("acepta un ajuste negativo con motivo", () => {
      const result = createInventoryAdjustmentSchema.safeParse({
        inventory_item_id: validItemId,
        quantity_delta: -3,
        reason: "Conteo físico encontró faltante",
      });
      expect(result.success).toBe(true);
    });

    it("rechaza un ajuste de cero", () => {
      const result = createInventoryAdjustmentSchema.safeParse({
        inventory_item_id: validItemId,
        quantity_delta: 0,
        reason: "Motivo válido",
      });
      expect(result.success).toBe(false);
    });

    it("rechaza ajuste sin motivo", () => {
      const result = createInventoryAdjustmentSchema.safeParse({
        inventory_item_id: validItemId,
        quantity_delta: 5,
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });
});