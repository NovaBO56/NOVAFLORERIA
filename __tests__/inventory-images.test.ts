import { describe, expect, it } from "vitest";
import { primaryProductImage } from "@/lib/product-images";
import { inventoryPhotos, type InventoryImageCandidate } from "@/lib/admin/inventory-images";

const items = [{ id: "stock-a", item_type: "componente" }, { id: "stock-b", item_type: "producto" }, { id: "paper", item_type: "insumo" }];
function candidate(productId = "product-a", itemId = "stock-a"): InventoryImageCandidate {
  return { inventory_item_id: itemId, product: { id: productId, name: "Artículo", images: [{ public_url: "/photo.webp", sort_order: 0 }], requirements: [{ inventory_item_id: itemId, quantity: 1 }], components: [] } };
}
describe("primary product image", () => {
  it("chooses the first usable saved image without reordering the source", () => {
    const images = [{ public_url: "/second.webp", sort_order: 2 }, { public_url: "", sort_order: 0 }, { public_url: "/first.webp", sort_order: 1 }];
    expect(primaryProductImage(images)?.public_url).toBe("/first.webp");
    expect(images[0].public_url).toBe("/second.webp");
  });
  it("returns no invented URL when media is absent", () => {
    expect(primaryProductImage()).toBeNull();
    expect(primaryProductImage([{ public_url: null }])).toBeNull();
  });
});
describe("inventory photo projection", () => {
  it("shows a saved photo only for an unambiguous one-unit sellable item", () => {
    expect(inventoryPhotos(items, [candidate()])).toEqual({ "stock-a": { image_url: "/photo.webp", image_alt: "Artículo" } });
    expect(inventoryPhotos(items, [candidate("finished", "stock-b")])["stock-b"]).toBeDefined();
  });
  it("never assigns a finished product photo to a pure supply", () => {
    expect(inventoryPhotos(items, [candidate("paper-product", "paper")])).toEqual({});
  });
  it("does not guess when two product records use the same physical item", () => {
    expect(inventoryPhotos(items, [candidate("one"), candidate("two")])).toEqual({});
  });
  it("treats repeated rows for the same product as one candidate", () => {
    expect(inventoryPhotos(items, [candidate(), candidate()])["stock-a"]).toBeDefined();
  });
  it("rejects multi-material recipes, non-unit quantities, and bundles", () => {
    for (const patch of [
      { requirements: [{ inventory_item_id: "stock-a", quantity: 1 }, { inventory_item_id: "paper", quantity: 1 }] },
      { requirements: [{ inventory_item_id: "stock-a", quantity: 2 }] },
      { components: [{ id: "child" }] },
      { components: null },
    ]) {
      const row = candidate();
      row.product = { ...row.product as Exclude<InventoryImageCandidate["product"], null | unknown[]>, ...patch };
      expect(inventoryPhotos(items, [row])).toEqual({});
    }
  });
  it("leaves a missing image empty and preserves all stock fields outside this projection", () => {
    const row = candidate();
    if (row.product && !Array.isArray(row.product)) row.product.images = [];
    expect(inventoryPhotos(items, [row])).toEqual({});
    expect(items).toEqual([{ id: "stock-a", item_type: "componente" }, { id: "stock-b", item_type: "producto" }, { id: "paper", item_type: "insumo" }]);
  });
  it("does not assign candidates from a different inventory item", () => {
    expect(inventoryPhotos(items, [candidate("foreign", "unknown-stock")])).toEqual({});
  });
});
