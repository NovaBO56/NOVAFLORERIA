import { beforeEach, describe, expect, it, vi } from "vitest";
import { readAllPages } from "@/lib/db/read-all-pages";
import { sumMoney } from "@/lib/money";
import { productPriceSchema, orderQuantitySchema, receivedAtSchema } from "@/validations/database-values";

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), auth: vi.fn(), writes: vi.fn(), tables: {} as Record<string, Record<string, unknown>[]>, queryError: null as null | { code: string; message: string }, queries: [] as { table: string; select?: string; range?: number[]; filters: unknown[] }[] }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from, rpc: mocks.rpc }) }));
vi.mock("@/lib/auth/permissions", () => ({ requireEmployeeOrAdmin: mocks.auth }));
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: vi.fn(async () => Buffer.from("%PDF-test")) }));
vi.mock("@/lib/reports/sales-report-pdf", () => ({ SalesReportDocument: vi.fn() }));
vi.mock("@/lib/reports/products-sold-report-pdf", () => ({ ProductsSoldReportDocument: vi.fn() }));
import { GET as listOrders } from "@/app/api/admin/orders/route";
import { GET as sales } from "@/app/api/admin/reports/sales/route";
import { GET as productsSold } from "@/app/api/admin/reports/products-sold/route";
import { GET as dashboard } from "@/app/api/admin/dashboard/route";
import { PATCH as patchProduct } from "@/app/api/admin/products/[id]/route";
import { GET as product } from "@/app/api/products/[id]/route";
import { GET as order } from "@/app/api/admin/orders/[id]/route";
import { POST as confirm } from "@/app/api/admin/payments/[id]/confirm/route";
import { POST as reject } from "@/app/api/admin/payments/[id]/reject/route";
import { POST as cancel } from "@/app/api/admin/orders/[id]/cancel/route";
import { PATCH as customer } from "@/app/api/admin/customers/[id]/route";
import { PATCH as inventory } from "@/app/api/admin/inventory/items/[id]/route";
const id = "550e8400-e29b-41d4-a716-446655440000";
const context = (value = id) => ({ params: Promise.resolve({ id: value }) });
const req = (body: string) => new Request("http://localhost", { method: "PATCH", body });

beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id }); mocks.queryError = null; mocks.tables = {}; mocks.queries = [];
  mocks.from.mockImplementation((table: string) => {
    const record: (typeof mocks.queries)[number] = { table, filters: [] }; mocks.queries.push(record);
    const chain: Record<string, unknown> = {};
    let single = false;
    chain.select = (select: string) => { record.select = select; return chain; };
    for (const method of ["eq", "is", "not", "in", "or", "gte", "lte", "order"]) chain[method] = (...args: unknown[]) => { record.filters.push([method, ...args]); return chain; };
    chain.range = (start: number, end: number) => { record.range = [start, end]; return chain; };
    for (const method of ["update", "insert"]) chain[method] = (...args: unknown[]) => { mocks.writes(...args); return chain; };
    for (const method of ["single", "maybeSingle"]) chain[method] = () => { single = true; return chain; };
    chain.then = (resolve: (value: unknown) => void) => {
      const data = mocks.tables[table] ?? [];
      return Promise.resolve({ data: single ? data[0] ?? null : record.range ? data.slice(record.range[0], record.range[1] + 1) : data, count: data.length, error: mocks.queryError }).then(resolve);
    };
    return chain;
  });
});

describe("PostgreSQL numeric and calendar contracts", () => {
  it.each([0, -1, 0.001, 1.234, 1e10, 1e20, Infinity, NaN])("rejects product price %s", value => expect(productPriceSchema.safeParse(value).success).toBe(false));
  it.each([0.01, 0.1, 12.34, 9999999999.99])("accepts product price %s", value => expect(productPriceSchema.safeParse(value).success).toBe(true));
  it.each([0, -1, 0.0001, 1e9, Infinity])("rejects order quantity %s", value => expect(orderQuantitySchema.safeParse(value).success).toBe(false));
  it.each([0.001, 0.5, 1.001, 999999999.999])("preserves numeric(12,3) quantity %s", value => expect(orderQuantitySchema.safeParse(value).success).toBe(true));
  it.each(["bad-date", "999999999-01-01", "2026-02-30", "2026-02-29", "2026-13-01", "2026-01-01T24:00:00Z"]) ("rejects impossible date %s", value => expect(receivedAtSchema.safeParse(value).success).toBe(false));
  it.each(["2024-02-29", "2026-10-12", "2026-10-12T08:30", "2026-10-12T08:30:00-04:00", "2026-10-12T12:30:00.000Z"]) ("accepts ISO %s", value => expect(receivedAtSchema.safeParse(value).success).toBe(true));
  it("sums money without decimal residues", () => expect(sumMoney(Array(1160).fill(0.1))).toBe(116));
});

describe("administrative validation before DB", () => {
  it.each(["", "{", '{"price":NaN}', '{"price":Infinity}', "null", "[]", '"string"']) ("PATCH product 400 for %j, no write", async body => {
    const response = await patchProduct(req(body), context()); expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toMatch(/position|Unexpected|token|JSON input/);
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.writes).not.toHaveBeenCalled();
  });
  it.each([0.001, 1e10, 1e20])("invalid price %s never writes", async price => { expect((await patchProduct(req(JSON.stringify({ price })), context())).status).toBe(400); expect(mocks.writes).not.toHaveBeenCalled(); });
  it("preserves 403 before reading JSON", async () => { mocks.auth.mockRejectedValueOnce(new Error("Usuario inactivo.")); expect((await patchProduct(req("{"), context())).status).toBe(403); expect(mocks.from).not.toHaveBeenCalled(); });
  it("does not mask a real write failure", async () => { mocks.queryError = { code: "XX000", message: "internal SQL" }; const response = await patchProduct(req('{"price":0.01}'), context()); expect(response.status).toBe(500); expect(JSON.stringify(await response.json())).not.toContain("internal SQL"); });
  for (const [name, handler] of [["product", product], ["order", order], ["confirm", confirm], ["reject", reject], ["cancel", cancel], ["customer", customer], ["inventory", inventory]] as const) {
    it(`${name}: invalid UUID rejected before DB/RPC`, async () => { expect((await handler(req('{}'), context("bad"))).status).toBe(400); expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled(); });
  }
  it("valid missing public product is 404", async () => expect((await product(req('{}'), context())).status).toBe(404));
  it("valid missing order is 404", async () => expect((await order(req('{}'), context())).status).toBe(404));
});

describe("volume regressions (unit mocks, real HTTP/SQL checked separately)", () => {
  function rows(count = 1160) { return Array.from({ length: count }, (_, i) => ({ id: String(i), order_number: i + 1, total: i === 0 ? 31136797.68 : 10, order_type: i % 2 ? "online" : "fisica", status: "finalizado", created_at: "2026-10-12", customer: null, payments: [] })); }
  it("orders returns page metadata beyond first 1000", async () => {
    mocks.tables.orders = rows(); const response = await listOrders(new Request("http://localhost/api/admin/orders?page=23&limit=50"));
    const body = await response.json(); expect(response.status).toBe(200); expect(body.orders[3].order_number).toBe(1104); expect(body.pagination).toEqual({ page: 23, limit: 50, total: 1160, total_pages: 24 });
  });
  it("search/payment/type/expired filters are sent to DB", async () => {
    await listOrders(new Request("http://localhost/api/admin/orders?search=1104&status=expirados&type=online&pending_payment=true"));
    const query = mocks.queries[0]; expect(query.select).toContain("payments!inner"); expect(query.filters).toContainEqual(["eq", "cancellation_reason", "Reserva de inventario vencida."]); expect(JSON.stringify(query.filters)).toContain("order_number.eq.1104");
  });
  it("sales JSON collects all 1160 and full monetary total", async () => {
    mocks.tables.orders = rows(); const response = await sales(new Request("http://localhost?from=2026-01-01&to=2027-12-31&format=json")); const body = await response.json();
    expect(body.orders).toHaveLength(1160); expect(body.summary.total_sales).toBe(31148387.68); expect(body.summary.count_online).toBe(580); expect(body.summary.count_fisica).toBe(580); expect(mocks.queries.map(x => x.range)).toEqual([[0,499],[500,999],[1000,1499]]);
  });
  it("sales PDF uses the complete result", async () => {
    mocks.tables.orders = rows(); const response = await sales(new Request("http://localhost?from=2026-01-01&to=2027-12-31&format=pdf")); expect(response.headers.get("content-type")).toBe("application/pdf"); expect(mocks.queries).toHaveLength(3);
  });
  it.each(["json", "pdf"])("products-sold %s joins parent orders and collects all items", async format => {
    mocks.tables.order_items = Array.from({length: 1160}, () => ({product_name_snapshot: "TEST", quantity: 0.5, line_total: 0.1}));
    const response = await productsSold(new Request(`http://localhost?from=2026-01-01&to=2027-12-31&format=${format}`)); expect(response.status).toBe(200);
    if (format === "json") expect((await response.json()).products).toEqual([{ product_name: "TEST", quantity: 580, revenue: 116 }]);
    expect(mocks.queries).toHaveLength(3); expect(mocks.queries[0].select).toContain("orders!inner"); expect(mocks.queries.flatMap(x => x.filters).filter(x => Array.isArray(x) && x[0] === "in")).toEqual(Array(3).fill(["in", "order.status", ["confirmado", "en_preparacion", "listo", "finalizado"]]));
  });
  it("dashboard uses all recent items without sending order UUIDs", async () => {
    mocks.tables.orders = rows(); mocks.tables.order_items = Array.from({length:1160}, () => ({product_name_snapshot:"TEST",quantity:1}));
    const response = await dashboard(); const body = await response.json(); expect(response.status).toBe(200); expect(body.dashboard.ventas_hoy).toBe(31148387.68); expect(body.dashboard.productos_mas_vendidos).toEqual([{name:"TEST",quantity:1160}]);
    expect(mocks.queries.filter(x=>x.table==='order_items')).toHaveLength(3);
  });
  it("a later page error never becomes partial success", async () => {
    await expect(readAllPages(async start => start ? {data:null,error:{message:"DB failure"},count:null} : {data:Array(500).fill(1),error:null,count:1160})).rejects.toThrow("DB failure");
  });
  it("continues even when the server caps pages below requested size", async () => {
    const data = Array.from({length:1160},(_,i)=>i); const all = await readAllPages(async start=>({data:data.slice(start,start+100),error:null,count:1160})); expect(all).toEqual(data);
  });
});
