import { describe, expect, it } from "vitest";
import { LAB_PREFIX, LAB_VERSION, categories, inventoryItems, products } from "../scripts/lab50-catalog.mjs";

describe("Local LAB50 catalog definitions", () => {
  it("identifies one stable version and exactly 50 unique numbered products", () => {
    expect(LAB_PREFIX).toBe("LAB50");
    expect(LAB_VERSION).toBe("1");
    expect(products).toHaveLength(50);
    expect(new Set(products.map(product => product.name)).size).toBe(50);
    expect(products.map(product => product.code)).toEqual(Array.from({ length: 50 }, (_, index) => `LAB50 ${String(index + 1).padStart(2, "0")}`));
  });

  it("defines ten families with five products each", () => {
    expect(categories).toHaveLength(10);
    expect(new Set(categories.map(category => category.key)).size).toBe(10);
    expect(categories.map(category => category.key)).toEqual([
      "rosas", "girasoles", "mixtos", "peluches", "cajas", "canastas", "romanticos", "cumpleanos", "temporada", "combos",
    ]);
    for (const category of categories) {
      expect(category.name).toContain(LAB_PREFIX);
      expect(products.filter(product => product.categoryKey === category.key)).toHaveLength(5);
    }
  });

  it("uses explicit demonstration copy and supported commercial field bounds", () => {
    for (const product of products) {
      expect(product.name.length).toBeLessThanOrEqual(200);
      expect(product.description).toContain("sintético de demostración");
      expect(product.description).toContain("No corresponde a una oferta ni a una venta real");
      expect(product.description.length).toBeLessThanOrEqual(2000);
      expect(product.price).toBeGreaterThanOrEqual(45);
      expect(product.price).toBeLessThanOrEqual(650);
      expect(Number.isInteger(product.price * 100)).toBe(true);
      expect(product.occasion.length).toBeLessThanOrEqual(120);
      expect(product.occasion.length).toBeGreaterThan(0);
    }
  });

  it("provides twelve unique synthetic inventory identifiers and ample entry quantities", () => {
    expect(inventoryItems).toHaveLength(12);
    expect(new Set(inventoryItems.map(item => item.key)).size).toBe(12);
    expect(new Set(inventoryItems.map(item => item.sku)).size).toBe(12);
    for (const item of inventoryItems) {
      expect(item.sku).toMatch(/^LAB50-/);
      expect(item.name).toContain(LAB_PREFIX);
      expect(["flor", "insumo", "componente", "producto"]).toContain(item.item_type);
      expect(item.entry_quantity).toBeGreaterThan(item.minimum_stock);
      expect(item.entry_quantity).toBe(item.item_type === "flor" || item.key === "follaje" ? 3000 : 300);
    }
  });

  it("gives every product a positive recipe referencing only known inventory", () => {
    const inventoryKeys = new Set(inventoryItems.map(item => item.key));
    for (const product of products) {
      expect(product.recipe.length).toBeGreaterThanOrEqual(4);
      expect(new Set(product.recipe.map(row => row.itemKey)).size).toBe(product.recipe.length);
      for (const row of product.recipe) {
        expect(inventoryKeys.has(row.itemKey)).toBe(true);
        expect(Number.isFinite(row.quantity)).toBe(true);
        expect(row.quantity).toBeGreaterThan(0);
        expect(Number.isInteger(row.quantity * 1000)).toBe(true);
      }
    }
  });
});
