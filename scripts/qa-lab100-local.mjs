/** Directed LOCAL-only HTTP/Auth/concurrency checks for the LAB100 fixture. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const lab = path.join(process.env.LOCALAPPDATA ?? "", "NOVA-Floreria", "inventory-refunds-final-replay");
const cfg = JSON.parse(fs.readFileSync(path.join(lab, "status.private.json"), "utf8").replace(/^\uFEFF/, ""));
const app = "http://127.0.0.1:3116";
if (cfg.API_URL !== "http://127.0.0.1:62621" || fs.existsSync(path.join(lab, "supabase/.temp/project-ref"))) throw Error("Unlinked NOVA-LOCAL-INTEGRITY required.");
const service = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const report = { checks: [], created: [], started_at: new Date().toISOString() };
const reportFile = path.join(lab, "lab100-qa.private.json");
const save = () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
function check(name, pass, evidence) { report.checks.push({ name, pass, evidence }); save(); console.log(`${pass ? "PASS" : "FAIL"} ${name}`); if (!pass) throw Error(name); }
async function rows(table, filter) { let query = service.from(table).select("*"); if (filter) query = filter(query); const result = await query; if (result.error) throw Error(`LOCAL read ${table}: ${result.error.code}`); return result.data; }

const adminCredential = JSON.parse(fs.readFileSync(path.join(lab, "admin.credentials.private.json"), "utf8").replace(/^\uFEFF/, ""));
const employeeFile = path.join(lab, "employee.credentials.private.json");
let employeeCredential = fs.existsSync(employeeFile) ? JSON.parse(fs.readFileSync(employeeFile, "utf8").replace(/^\uFEFF/, "")) : null;
const employeeEmail = "empleado.lab100@example.invalid";
const listed = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) throw Error("Could not inspect LOCAL Auth users.");
let employeeUser = listed.data.users.find(user => user.email === employeeEmail);
if (!employeeUser) {
  employeeCredential = { email: employeeEmail, password: crypto.randomBytes(24).toString("base64url") + "aA7!" };
  const created = await service.auth.admin.createUser({ ...employeeCredential, email_confirm: true, user_metadata: { full_name: "Empleado LAB100" } });
  if (created.error) throw Error("Could not create synthetic LOCAL employee.");
  employeeUser = created.data.user;
  fs.writeFileSync(employeeFile, JSON.stringify(employeeCredential));
}
if (!employeeCredential) throw Error("Existing LOCAL employee requires its private credential file.");
const employeeProfile = await service.from("profiles").update({ role: "empleado", is_active: true }).eq("id", employeeUser.id);
if (employeeProfile.error) throw Error("Could not activate synthetic LOCAL employee.");

const cookies = {};
for (const [role, credential] of [["admin", adminCredential], ["employee", employeeCredential]]) {
  const jar = new Map();
  const client = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
  const login = await client.auth.signInWithPassword(credential);
  check(`real Auth ${role}`, !login.error);
  cookies[role] = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

let requestNumber = 20;
const runNetwork = crypto.randomInt(20, 200);
async function http(route, body, role = "anon", method = body === undefined ? "GET" : "POST", sharedIp) {
  const response = await fetch(app + route, { method, redirect: "manual", signal: AbortSignal.timeout(60000), headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookies[role] ? { cookie: cookies[role] } : {}), "x-forwarded-for": sharedIp ?? `198.18.100.${requestNumber++}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = response.headers.get("content-type")?.includes("json") ? await response.json() : null;
  return { status: response.status, data };
}

for (const route of ["/", "/checkout", "/seguimiento", "/login"]) check(`public page ${route}`, (await http(route)).status === 200);
for (const route of ["/admin", "/admin/pedidos", "/admin/productos", "/admin/inventario", "/admin/caja", "/admin/reportes", "/admin/promociones", "/admin/configuracion", "/admin/auditoria"]) check(`admin page ${route}`, (await http(route, undefined, "admin")).status === 200);
check("employee reads operational orders", (await http("/api/admin/orders?limit=5", undefined, "employee")).status === 200);
check("employee cannot change critical system settings", (await http("/api/admin/system-settings?key=delivery_enabled", { value: { enabled: false } }, "employee", "PATCH")).status === 403);

const catalog = await http("/api/products?limit=12&page=1");
const page9 = await http("/api/products?limit=12&page=9");
const page10 = await http("/api/products?limit=12&page=10");
const search = await http("/api/products?limit=12&page=1&search=Girasoles");
check("catalog exposes exactly 100 saleable products", catalog.status === 200 && catalog.data.pagination.total === 100 && catalog.data.products.length === 12);
check("catalog pagination final/outside pages", page9.data.products.length === 4 && page10.data.products.length === 0);
check("catalog search covers both Girasoles variants", search.data.pagination.total === 10);

const product = (await rows("products", query => query.eq("name", "LAB50 01 · Rosas carmín · Detalle")))[0];
const phone = "00026101", orderKey = crypto.randomUUID();
const orderPayload = { customer_name: "LAB100 Concurrencia", customer_phone: phone, items: [{ product_id: product.id, quantity: 1 }], customer_message: "Método: Retiro en tienda\nLAB100 · concurrencia", idempotency_key: orderKey };
const orders = await Promise.all([http("/api/orders", orderPayload, "anon", "POST", `198.18.${runNetwork}.1`), http("/api/orders", orderPayload, "anon", "POST", `198.18.${runNetwork}.1`)]);
const orderIds = orders.map(result => result.data?.order_id).filter(Boolean);
check("concurrent duplicate order is idempotent", orders.every(result => result.status === 201) && new Set(orderIds).size === 1, orders.map(result => result.status));
const orderId = orderIds[0]; report.created.push({ kind: "order", id: orderId }); save();
const payments = await Promise.all([http(`/api/orders/${orderId}/payment`, { customer_phone: phone, qr_slot: "qr_1" }, "anon", "POST", `198.18.${runNetwork}.2`), http(`/api/orders/${orderId}/payment`, { customer_phone: phone, qr_slot: "qr_1" }, "anon", "POST", `198.18.${runNetwork}.2`)]);
const paymentIds = payments.map(result => result.data?.payment?.id).filter(Boolean);
check("concurrent payment report is idempotent", payments.every(result => result.status === 200) && new Set(paymentIds).size === 1);
const confirms = await Promise.all([http(`/api/admin/payments/${paymentIds[0]}/confirm`, {}, "employee"), http(`/api/admin/payments/${paymentIds[0]}/confirm`, {}, "employee")]);
check("concurrent confirmation has one effective result", confirms.some(result => result.status === 200) && confirms.every(result => [200, 400].includes(result.status)), confirms.map(result => result.status));
const requirements = await rows("product_inventory_requirements", query => query.eq("product_id", product.id));
const consumed = await rows("inventory_movements", query => query.eq("reference_type", "order").eq("reference_id", orderId).eq("movement_type", "salida"));
check("concurrent confirmation consumes each recipe line once", consumed.length === requirements.length);
const advances = await Promise.all([http(`/api/admin/orders/${orderId}/status`, { new_status: "en_preparacion" }, "employee"), http(`/api/admin/orders/${orderId}/status`, { new_status: "en_preparacion" }, "employee")]);
const finalOrder = (await rows("orders", query => query.eq("id", orderId)))[0];
check("concurrent status transition ends once in preparation", advances.some(result => result.status === 200) && finalOrder.status === "en_preparacion", advances.map(result => result.status));

const suffix = crypto.randomUUID().slice(0, 8), sku = `LAB100-C-${suffix}`;
const itemResult = await http("/api/admin/inventory/items", { name: `LAB100 Stock último ${suffix}`, sku, item_type: "flor", unit: "tallo", minimum_stock: 0 }, "admin");
const itemId = itemResult.data.item.id;
await http("/api/admin/inventory/entries", { inventory_item_id: itemId, quantity: 1, unit_cost: 1, supplier_name: "LAB100 sintético", notes: `LAB100-${suffix}` }, "admin");
const productResult = await http("/api/admin/products", { name: `LAB100 Concurrencia física ${suffix}`, description: "Producto sintético temporal para concurrencia local.", price: 10, is_active: false, is_available: false }, "admin");
const physicalProduct = productResult.data.product.id;
await http(`/api/admin/products/${physicalProduct}/inventory-requirements`, { inventory_item_id: itemId, quantity: 1 }, "admin");
await http(`/api/admin/products/${physicalProduct}`, { is_active: true, is_available: true }, "admin", "PATCH");
const sales = await Promise.all([http("/api/admin/sales", { items: [{ product_id: physicalProduct, quantity: 1 }], payment_method: "efectivo" }, "admin"), http("/api/admin/sales", { items: [{ product_id: physicalProduct, quantity: 1 }], payment_method: "efectivo" }, "admin")]);
check("two physical sales competing for last stock have one winner", sales.map(result => result.status).sort().join(",") === "201,400", sales.map(result => result.status));
const stock = (await rows("inventory_items", query => query.eq("id", itemId)))[0];
check("last physical unit never becomes negative", Number(stock.current_stock) === 0);
await http(`/api/admin/products/${physicalProduct}`, { is_active: false, is_available: false }, "admin", "PATCH");
report.created.push({ kind: "synthetic_concurrency_product", id: physicalProduct });

const partialSuffix = crypto.randomUUID().slice(0, 8);
const partialItem = (await http("/api/admin/inventory/items", { name: `LAB100 Stock parcial ${partialSuffix}`, sku: `LAB100-P-${partialSuffix}`, item_type: "flor", unit: "tallo", minimum_stock: 0 }, "admin")).data.item.id;
await http("/api/admin/inventory/entries", { inventory_item_id: partialItem, quantity: 1, unit_cost: 1, supplier_name: "LAB100 sintético", notes: `LAB100-P-${partialSuffix}` }, "admin");
const partialProduct = (await http("/api/admin/products", { name: `LAB100 Venta 200 ${partialSuffix}`, description: "Producto sintético temporal para conciliación financiera local.", price: 200, is_active: false, is_available: false }, "admin")).data.product.id;
await http(`/api/admin/products/${partialProduct}/inventory-requirements`, { inventory_item_id: partialItem, quantity: 1 }, "admin");
await http(`/api/admin/products/${partialProduct}`, { is_active: true, is_available: true }, "admin", "PATCH");
const partialSale = await http("/api/admin/sales", { items: [{ product_id: partialProduct, quantity: 1 }], payment_method: "efectivo" }, "admin");
const partialOrder = partialSale.data.sale.id;
const partialRefund = await http(`/api/admin/orders/${partialOrder}/returns`, { type: "reintegro", amount: 50, reason: "LAB100 · reintegro parcial 50 de venta 200", idempotency_key: crypto.randomUUID() }, "admin");
const partialRows = await rows("sale_returns", query => query.eq("order_id", partialOrder));
check("sale Bs 200 and refund Bs 50 reconcile to Bs 150", partialSale.status === 201 && partialRefund.status === 201 && Number(partialSale.data.sale.total) === 200 && partialRows.length === 1 && Number(partialRows[0].amount) === 50);
check("monetary-only partial refund does not restore physical stock", Number((await rows("inventory_items", query => query.eq("id", partialItem)))[0].current_stock) === 0);
await http(`/api/admin/products/${partialProduct}`, { is_active: false, is_available: false }, "admin", "PATCH");
report.created.push({ kind: "partial_refund_order", id: partialOrder });

const ninetyOrders = await rows("orders", query => query.eq("total", 90));
const ninetyReturns = ninetyOrders.length ? await rows("sale_returns", query => query.in("order_id", ninetyOrders.map(order => order.id))) : [];
check("sale Bs 90 and total refund Bs 90 reconcile to zero", ninetyOrders.some(order => Math.abs(ninetyReturns.filter(record => record.order_id === order.id).reduce((sum, record) => sum + Number(record.amount), 0) - 90) < .00001));

const rateStatuses = [];
for (let index = 0; index < 22; index++) rateStatuses.push((await http("/api/orders/track", { order_number: 999999999, customer_phone: "00000000" }, "anon", "POST", `198.18.${runNetwork}.9`)).status);
check("public tracking rate limit activates", rateStatuses.includes(429), rateStatuses);
report.finished_at = new Date().toISOString(); save();
console.log(JSON.stringify({ checks: report.checks.length, passed: report.checks.filter(check => check.pass).length, created: report.created }, null, 2));
