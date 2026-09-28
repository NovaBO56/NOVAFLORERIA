import { describe, expect, it } from "vitest";
import { listProductsQuerySchema } from "@/validations/products";
import { updateComponentSchema } from "@/validations/product-components";
import { reorderImagesSchema } from "@/validations/product-images";
import { updateImageSchema } from "@/validations/product-images-detail";

const validCategoryId = "e71f5830-6516-45cd-968a-fe61ca62a524";

describe("Filtros de listado de productos (Zod real de producción)", () => {
  it("sin filtros: todo opcional, order por defecto 'asc'", () => {
    const result = listProductsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBeUndefined();
      expect(result.data.order).toBe("asc");
    }
  });

  it("acepta filtros combinados válidos", () => {
    const result = listProductsQuerySchema.safeParse({
      search: "rosa",
      category_id: validCategoryId,
      is_active: "true",
      is_sold_out: "false",
      min_price: "10",
      max_price: "100",
      sort: "price",
      order: "desc",
      page: "2",
      limit: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.is_sold_out).toBe(false);
      expect(result.data.min_price).toBe(10);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rechaza category_id que no es uuid", () => {
    expect(listProductsQuerySchema.safeParse({ category_id: "abc" }).success).toBe(false);
  });

  it("rechaza una columna de orden fuera de la whitelist (evita sort injection)", () => {
    expect(listProductsQuerySchema.safeParse({ sort: "id; drop table products;" }).success).toBe(false);
  });

  it("rechaza is_active con un valor que no sea true/false", () => {
    expect(listProductsQuerySchema.safeParse({ is_active: "yes" }).success).toBe(false);
  });

  it("rechaza min_price mayor a max_price", () => {
    expect(listProductsQuerySchema.safeParse({ min_price: "100", max_price: "10" }).success).toBe(false);
  });

  it("rechaza limit mayor a 100 o page menor a 1", () => {
    expect(listProductsQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(listProductsQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("updateComponentSchema (cantidad de componente, Zod real)", () => {
  it("acepta una cantidad decimal válida", () => {
    expect(updateComponentSchema.safeParse({ quantity: 2.5 }).success).toBe(true);
  });

  it("rechaza cantidad cero o negativa", () => {
    expect(updateComponentSchema.safeParse({ quantity: 0 }).success).toBe(false);
    expect(updateComponentSchema.safeParse({ quantity: -1 }).success).toBe(false);
  });
});

describe("reorderImagesSchema (Zod real)", () => {
  it("acepta una lista de ids válida", () => {
    expect(reorderImagesSchema.safeParse({ image_ids: [validCategoryId] }).success).toBe(true);
  });

  it("rechaza una lista vacía", () => {
    expect(reorderImagesSchema.safeParse({ image_ids: [] }).success).toBe(false);
  });

  it("rechaza un id que no es uuid", () => {
    expect(reorderImagesSchema.safeParse({ image_ids: ["no-es-uuid"] }).success).toBe(false);
  });
});

describe("updateImageSchema (Zod real)", () => {
  it("acepta alt_text nulo", () => {
    expect(updateImageSchema.safeParse({ alt_text: null }).success).toBe(true);
  });

  it("acepta un texto válido", () => {
    expect(updateImageSchema.safeParse({ alt_text: "Ramo de rosas rojas" }).success).toBe(true);
  });

  it("rechaza un alt_text demasiado largo", () => {
    expect(updateImageSchema.safeParse({ alt_text: "a".repeat(301) }).success).toBe(false);
  });
});