import { describe, expect, it } from "vitest";
import { canAddRecommendation, moveRecommendation, recommendationStatus, recommendationPreview, recommendationImage, type RecommendationChoice } from "@/components/admin/products/recommendation-options";

const product: RecommendationChoice = { id: "extra", name: "Chocolate", price: 35.5, is_active: true, is_available: true, is_sold_out: false };
describe("Recommendation editor selection and ordering", () => {
  it("accepts a distinct available commercial product without changing its price", () => {
    expect(canAddRecommendation(product, "main", [])).toBe(true);
    expect(product.price).toBe(35.5);
  });
  it("blocks the main product, duplicates and a fifth choice", () => {
    expect(canAddRecommendation(product, "extra", [])).toBe(false);
    expect(canAddRecommendation(product, "main", ["extra"])).toBe(false);
    expect(canAddRecommendation(product, "main", ["1", "2", "3", "4"])).toBe(false);
  });
  it.each([
    [{ is_active: false }, "Inactivo"],
    [{ is_sold_out: true }, "Agotado"],
    [{ is_available: false }, "No disponible"],
  ] as const)("labels and blocks unavailable selection %j", (flags, label) => {
    const choice = { ...product, ...flags };
    expect(recommendationStatus(choice)).toBe(label);
    expect(canAddRecommendation(choice, "main", [])).toBe(false);
  });
  it("moves both directions without mutating the original or discarding unknown saved IDs", () => {
    const saved = ["unresolved", "extra", "third"];
    expect(moveRecommendation(saved, 1, -1)).toEqual(["extra", "unresolved", "third"]);
    expect(moveRecommendation(saved, 1, 1)).toEqual(["unresolved", "third", "extra"]);
    expect(saved).toEqual(["unresolved", "extra", "third"]);
    expect(moveRecommendation(saved, 0, -1)).toBe(saved);
    expect(moveRecommendation(saved, 2, 1)).toBe(saved);
  });
  it("preview respects saved order and current catalog prices without mutating unresolved references", () => {
    const selected = ["missing", "second", "extra"];
    const choices = [product, { ...product, id: "second", price: 20 }];
    const available = { extra: { is_available: true, is_sold_out: false }, second: { is_available: true, is_sold_out: false } };
    expect(recommendationPreview(choices, selected, available).map(p => [p.id, p.price])).toEqual([["second", 20], ["extra", 35.5]]);
    expect(selected).toEqual(["missing", "second", "extra"]);
  });
  it("preview waits for server availability and excludes inactive or exhausted products without deleting them", () => {
    const choices = [product, { ...product, id: "inactive", is_active: false }];
    expect(recommendationPreview(choices, ["extra"], {})).toEqual([]);
    expect(recommendationPreview(choices, ["extra", "inactive"], { extra: { is_available: false, is_sold_out: true }, inactive: { is_available: true, is_sold_out: false } })).toEqual([]);
    expect(choices).toHaveLength(2);
  });
  it("uses the first ordered real photo, preserving its source order and neutral empty states", () => {
    const images = [{ public_url: "second.webp", sort_order: 2 }, { public_url: "main.webp", sort_order: 0 }];
    expect(recommendationImage({ ...product, images })).toBe("main.webp");
    expect(images[0].public_url).toBe("second.webp");
    expect(recommendationImage({ ...product, images: [] })).toBeNull();
    expect(recommendationImage(product)).toBeUndefined();
  });
});
