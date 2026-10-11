import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), response: vi.fn(), insert: vi.fn(), update: vi.fn(), range: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
vi.mock("@/lib/auth/permissions", () => ({ requireAdmin: vi.fn(), requireEmployeeOrAdmin: vi.fn() }));
import { GET as catalog } from "@/app/api/products/route";
import { POST as promotionProduct } from "@/app/api/admin/promotions/[id]/products/route";
import { POST as createProduct } from "@/app/api/admin/products/route";
import { PATCH as updateProduct } from "@/app/api/admin/products/[id]/route";
import { createProductSchema, updateProductSchema } from "@/validations/products";
const id = "550e8400-e29b-41d4-a716-446655440000";
const context = { params: Promise.resolve({ id }) };
const req = (body: unknown) => new Request("http://localhost", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "ilike", "gte", "lte", "order", "maybeSingle", "single"]) chain[method] = () => chain;
  chain.insert = mocks.insert.mockReturnValue(chain);
  chain.update = mocks.update.mockReturnValue(chain);
  chain.range = mocks.range.mockReturnValue(chain);
  chain.then = (resolve: (value: unknown) => void) => Promise.resolve(mocks.response()).then(resolve);
  mocks.from.mockReturnValue(chain);
});
describe("Catálogo: páginas válidas fuera del conjunto", () => {
  it.each([1, 3])("devuelve la página %i con conteo exacto", async page => {
    mocks.response.mockReturnValue({ data: [{ id }], error: null, count: 49 });
    const response = await catalog(new Request(`http://localhost/api/products?page=${page}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ products: [{ id }], pagination: { page, total: 49, total_pages: 3 } });
  });
  it.each([4, 9999])("recupera el total para página %i sin devolver filas de otra página", async page => {
    mocks.response.mockReturnValueOnce({ data: null, error: { code: "PGRST103" }, count: null })
      .mockReturnValueOnce({ data: [{ id }], error: null, count: 49 });
    const response = await catalog(new Request(`http://localhost/api/products?page=${page}&search=TEST`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ products: [], pagination: { page, total: 49, total_pages: 3 } });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.range).toHaveBeenLastCalledWith(0, 0);
  });
  it.each(["page=0", "page=-1", "limit=0", "limit=61"])("rechaza %s antes de consultar DB", async query => {
    expect((await catalog(new Request(`http://localhost/api/products?${query}`))).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("no oculta errores reales de DB", async () => {
    mocks.response.mockReturnValue({ error: { code: "42501" }, data: null, count: null });
    expect((await catalog(new Request("http://localhost/api/products?page=9999"))).status).toBe(500);
    expect(mocks.response).toHaveBeenCalledTimes(1);
  });
  it("un fallo al recuperar el conteo sigue siendo 500", async () => {
    mocks.response.mockReturnValueOnce({ error: { code: "PGRST103" }, count: null })
      .mockReturnValueOnce({ error: { code: "XX000" }, count: null });
    expect((await catalog(new Request("http://localhost/api/products?page=9999"))).status).toBe(500);
  });
});
describe("Productos de promociones", () => {
  it.each([["producto", "porcentaje"], ["producto", "monto_fijo"], ["combo", "porcentaje"], ["combo", "monto_fijo"]])("producto inexistente devuelve 404 en %s/%s, sin INSERT", async (promotion_type, discount_type) => {
    mocks.response.mockReturnValueOnce({ data: { promotion_type, discount_type, discount_value: 10 } })
      .mockReturnValueOnce({ data: null });
    const response = await promotionProduct(req({ product_id: id }), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ message: "El producto no existe." });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("promoción inexistente devuelve 404", async () => {
    mocks.response.mockReturnValue({ data: null });
    expect((await promotionProduct(req({ product_id: id }), context)).status).toBe(404);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("UUID inválido devuelve 400", async () => {
    expect((await promotionProduct(req({ product_id: "no-uuid" }), context)).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([[null, 201], [{ code: "23505" }, 409], [{ code: "XX000" }, 500]])("mantiene resultado INSERT %j → %i", async (error, status) => {
    mocks.response.mockReturnValueOnce({ data: { promotion_type: "producto", discount_type: "porcentaje", discount_value: 10 } })
      .mockReturnValueOnce({ data: { name: "TEST", price: 20 } }).mockReturnValueOnce({ error });
    expect((await promotionProduct(req({ product_id: id }), context)).status).toBe(status);
  });
  it("rechaza monto fijo superior al precio", async () => {
    mocks.response.mockReturnValueOnce({ data: { promotion_type: "producto", discount_type: "monto_fijo", discount_value: 21 } })
      .mockReturnValueOnce({ data: { name: "TEST", price: 20 } });
    expect((await promotionProduct(req({ product_id: id }), context)).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("error real al verificar producto devuelve 500", async () => {
    mocks.response.mockReturnValueOnce({ data: { promotion_type: "combo" } })
      .mockReturnValueOnce({ error: { code: "XX000" }, data: null });
    expect((await promotionProduct(req({ product_id: id }), context)).status).toBe(500);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
describe("Precio regular estrictamente positivo", () => {
  it.each([0, -1, "0", "", null])("create/update rechazan precio %j antes de escribir", async price => {
    expect(createProductSchema.safeParse({ name: "TEST", price }).success).toBe(false);
    expect(updateProductSchema.safeParse({ price }).success).toBe(false);
    expect((await createProduct(req({ name: "TEST", price }))).status).toBe(400);
    expect((await updateProduct(req({ price }), context)).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([0.01, 20])("create/update aceptan precio %j", async price => {
    mocks.response.mockReturnValue({ data: { id, price }, error: null });
    expect((await createProduct(req({ name: "TEST", price }))).status).toBe(201);
    expect((await updateProduct(req({ price }), context)).status).toBe(200);
  });
  it("editar otro campo no exige reenviar el precio", () => {
    expect(updateProductSchema.safeParse({ name: "TEST" }).success).toBe(true);
  });
});
