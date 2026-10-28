import { describe, expect, it } from "vitest";
import { withOrderItemImages, type OrderImageRow } from "@/lib/public/order-item-images";

const item = { product_name: "Ramo comprado", quantity: 2, unit_price: 90, line_total: 180, message: "Con cariño", dedications: [{ text: "Mensaje histórico" }] };
const row: OrderImageRow = { product_id: "product-a", product_name_snapshot: item.product_name, quantity: "2.000", unit_price_snapshot: "90.00", line_total: "180.00", product: { images: [{ public_url: "/second.webp", sort_order: 2 }, { public_url: "/principal.webp", sort_order: 0 }] } };

describe("Order image enrichment preserves the historical purchase", () => {
  it("adds only the main current photo and retains every historical field", () => {
    const original = structuredClone(item);
    expect(withOrderItemImages([item], [row])[0]).toEqual({ ...item, image_url: "/principal.webp" });
    expect(item).toEqual(original);
    expect(row.product).toEqual({ images: [{ public_url: "/second.webp", sort_order: 2 }, { public_url: "/principal.webp", sort_order: 0 }] });
  });
  it("does not infer an image from the name alone when quantity or prices differ", () => {
    expect(withOrderItemImages([{ ...item, unit_price: 95 }], [row])[0].image_url).toBeNull();
    expect(withOrderItemImages([{ ...item, quantity: 1 }], [row])[0].image_url).toBeNull();
    expect(withOrderItemImages([{ ...item, line_total: 179 }], [row])[0].image_url).toBeNull();
  });
  it("never guesses between different product IDs with the same historical identity", () => {
    const other = { ...row, product_id: "product-b", product: { images: [{ public_url: "/wrong.webp", sort_order: 0 }] } };
    expect(withOrderItemImages([item], [row, other])[0].image_url).toBeNull();
  });
  it("permits repeated order lines of the same product and handles the join array shape", () => {
    expect(withOrderItemImages([item, item], [row, { ...row, product: [{ images: [{ public_url: "/principal.webp", sort_order: 0 }] }] }]).map(entry => entry.image_url)).toEqual(["/principal.webp", "/principal.webp"]);
  });
  it("uses an empty fallback for deleted products, absent photos and unavailable metadata", () => {
    for (const rows of [[], [{ ...row, product: null }], [{ ...row, product_id: null }], [{ ...row, product: { images: [{ public_url: "", sort_order: 0 }] } }]]) {
      expect(withOrderItemImages([item], rows)[0]).toEqual({ ...item, image_url: null });
    }
  });
});
