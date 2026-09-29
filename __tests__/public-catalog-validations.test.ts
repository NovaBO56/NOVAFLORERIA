import { describe, expect, it } from "vitest";
import { listPublicProductsQuerySchema, trackOrderSchema } from "@/validations/public-catalog";

const validCategoryId = "e71f5830-6516-45cd-968a-fe61ca62a524";

describe("Filtros del catálogo público (Zod real de producción)", () => {
  it("sin filtros: page=1, limit=24, order=asc por defecto", () => {
    const result = listPublicProductsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(24);
      expect(result.data.order).toBe("asc");
    }
  });

  it("acepta filtros combinados válidos", () => {
    const result = listPublicProductsQuerySchema.safeParse({
      search: "rosa",
      category_id: validCategoryId,
      is_featured: "true",
      min_price: "50",
      max_price: "300",
      sort: "price",
      order: "desc",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza category_id que no es uuid", () => {
    expect(listPublicProductsQuerySchema.safeParse({ category_id: "abc" }).success).toBe(false);
  });

  it("rechaza una columna de orden fuera de la whitelist", () => {
    expect(listPublicProductsQuerySchema.safeParse({ sort: "is_active" }).success).toBe(false);
  });

  it("rechaza min_price mayor a max_price", () => {
    expect(listPublicProductsQuerySchema.safeParse({ min_price: "300", max_price: "50" }).success).toBe(false);
  });

  it("rechaza limit mayor a 60", () => {
    expect(listPublicProductsQuerySchema.safeParse({ limit: "61" }).success).toBe(false);
  });

  it("no acepta is_active como filtro (el público nunca lo controla)", () => {
    const result = listPublicProductsQuerySchema.safeParse({ is_active: "false" });
    // Zod ignora claves no declaradas en el schema: is_active simplemente no queda en el resultado.
    expect(result.success).toBe(true);
    if (result.success) {
      expect("is_active" in result.data).toBe(false);
    }
  });
});

describe("trackOrderSchema (Zod real de producción)", () => {
  it("acepta un número de pedido y teléfono válidos", () => {
    expect(trackOrderSchema.safeParse({ order_number: 125, customer_phone: "70011223" }).success).toBe(true);
  });

  it("rechaza número de pedido negativo o cero", () => {
    expect(trackOrderSchema.safeParse({ order_number: 0, customer_phone: "70011223" }).success).toBe(false);
    expect(trackOrderSchema.safeParse({ order_number: -5, customer_phone: "70011223" }).success).toBe(false);
  });

  it("rechaza teléfono demasiado corto", () => {
    expect(trackOrderSchema.safeParse({ order_number: 125, customer_phone: "123" }).success).toBe(false);
  });

  it("rechaza si falta el order_number", () => {
    expect(trackOrderSchema.safeParse({ customer_phone: "70011223" }).success).toBe(false);
  });
});