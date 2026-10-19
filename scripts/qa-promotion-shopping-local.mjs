// Real, additive functional checks. Fixed existing LOCAL lab only; no reset/SQL.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

if (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() !== "codex/inventory-refunds-dashboard-2") throw Error("Wrong branch.");
const lab = path.join(process.env.LOCALAPPDATA ?? "", "NOVA-Floreria", "inventory-refunds-final-replay");
const read = name => JSON.parse(fs.readFileSync(path.join(lab, name), "utf8").replace(/^\uFEFF/, ""));
const cfg = read("status.private.json");
if (cfg.API_URL !== "http://127.0.0.1:62621" || fs.existsSync(path.join(lab, "supabase/.temp/project-ref")) || !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab, "supabase/config.toml"), "utf8"))) throw Error("Existing unlinked LOCAL lab required.");
const app = "http://127.0.0.1:3116";
const reportFile = path.join(lab, "promotion-shopping-qa.private.json");
const report = fs.existsSync(reportFile) ? read("promotion-shopping-qa.private.json") : { checks: [], promotions: [], orders: [], started: new Date().toISOString() };
const save = () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
function check(name, pass, evidence) { report.checks.push({ name, pass, evidence }); save(); console.log(`${pass ? "PASS" : "FAIL"} ${name}`); if (!pass) throw Error(name); }
const service = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const jar = new Map();
const admin = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
const login = await admin.auth.signInWithPassword(read("admin.credentials.private.json"));
check("real LOCAL admin Auth", !login.error);
const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
let request = 1;
const network = crypto.randomInt(1, 200);
async function http(route, body, staff = false, method = body === undefined ? "GET" : "POST") {
  const response = await fetch(app + route, { method, redirect: "error", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json", "x-forwarded-for": `198.19.${network}.${request++}`, ...(staff ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, data: response.headers.get("content-type")?.includes("json") ? JSON.parse(bytes.toString()) : null, bytes };
}
async function rows(table, filter) { const result = await filter(service.from(table).select("*")); if (result.error) throw Error(`LOCAL read ${table}: ${result.error.code}`); return result.data; }
const fixture = read("lab50-results.private.json");
const ids = [fixture.products["LAB50 01"], fixture.products["LAB50 02"], fixture.products["LAB50 06"]];
const products = await rows("products", query => query.in("id", ids));
const [rose, second, unrelated] = ids.map(id => products.find(product => product.id === id));
if (!rose || !second || !unrelated) throw Error("LAB100 products required.");
if (process.argv.includes("--customization-only")) {
  const offer = report.promotions.find(promotion => promotion.key === "porcentaje");
  if (!offer) throw Error("Run the main local promotion suite first.");
  const optionName = "TEST PROMO SHOP Envoltura extra";
  let option = (await rows("customization_options", query => query.eq("product_id", rose.id).eq("name", optionName)))[0];
  if (!option) {
    const created = await http(`/api/admin/products/${rose.id}/customization-options`, { option_type: "decoracion", name: optionName, value: "Envoltura sintética local", extra_price: 5 }, true);
    if (created.status !== 201) throw Error("Could not configure LOCAL synthetic option.");
    option = created.data.option;
    const requirement = await http(`/api/admin/products/${rose.id}/customization-options/${option.id}/inventory-requirements`, { inventory_item_id: fixture.items.papel, quantity: .1 }, true);
    if (requirement.status !== 201) throw Error("Could not configure LOCAL option inventory.");
    report.option = option.id; save();
  }
  const phone = `0004${String(network).padStart(2, "0").slice(-2)}01`;
  const existing = (await rows("orders", query => query.eq("guest_name", "TEST PROMO SHOP Personalizado")))[0];
  const created = existing ? { status: 201, data: { order_id: existing.id } } : await http("/api/orders", { customer_name: "TEST PROMO SHOP Personalizado", customer_phone: phone, customer_message: "Método: Retiro en tienda", idempotency_key: crypto.randomUUID(), promotion_id: offer.id, items: [{ product_id: rose.id, quantity: 1, customization_option_ids: [option.id], message: "TEST tarjeta conservada" }] });
  check("personalized order through real HTTP (or preserved prior successful creation)", created.status === 201);
  const saved = (await rows("orders", query => query.eq("id", created.data.order_id)))[0];
  const items = await rows("order_items", query => query.eq("order_id", saved.id));
  check("personalization surcharge/discount/message recorded exactly", Number(saved.subtotal) === 50 && Number(saved.discount_total) === 5 && Number(saved.total) === 45 && Number(items[0].unit_price_snapshot) === 50 && items[0].message === "TEST tarjeta conservada" && items[0].personalization[0].id === option.id);
  report.orders.push({ id: saved.id, number: saved.order_number, phone, label: "customized surcharge real HTTP" }); save();
  console.log("PASS personalization real HTTP supplement complete");
  process.exit(0);
}
if (report.finished) throw Error("This synthetic suite has completed. Use --customization-only for its supplementary case; keep prior evidence/data.");
const prefix = `TEST PROMO SHOP ${Date.now()}`;
async function offer(key, fields, components) {
  const existing = report.promotions.find(promotion => promotion.key === key);
  if (existing) return existing.id;
  const result = await http("/api/admin/promotions", { name: `${prefix} ${key}`, description: "Promoción sintética LOCAL. No exportar como oferta real.", promotion_type: "producto", discount_type: "porcentaje", discount_value: 10, ...fields }, true);
  if (result.status !== 201) throw Error(`Create LOCAL offer ${key}: ${result.status}`);
  const id = result.data.promotion.id; report.promotions.push({ key, id }); save();
  for (const component of components) { const associated = await http(`/api/admin/promotions/${id}/products`, { product_id: component.id, quantity: component.quantity ?? 1 }, true); if (associated.status !== 201) throw Error(`Associate ${key}`); }
  return id;
}
const percent = await offer("porcentaje", {}, [rose]);
const fixed = await offer("fijo", { discount_type: "monto_fijo", discount_value: 20 }, [rose]);
const minimum = await offer("minimo", { minimum_purchase: 150 }, [rose]);
const combo = await offer("combo", { promotion_type: "combo", discount_type: undefined, discount_value: undefined, combo_price: 100 }, [rose, second]);
const expired = await offer("vencida", { starts_at: "2000-01-01T00:00:00Z", ends_at: "2001-01-01T00:00:00Z" }, [rose]);
const inactive = await offer("inactiva", {}, [rose]);
await http(`/api/admin/promotions/${inactive}`, { is_active: false }, true, "PATCH");
const free = await offer("gratis", { discount_value: 100 }, [rose]);
const explicitCategory = await offer("seleccion-categoria", {}, [rose, second]);
check("category-like selection is explicit products from the same category", rose.category_id === second.category_id && Boolean(rose.category_id));
const publicOffers = await http("/api/promotions");
check("public offers include real participant names and images", publicOffers.status === 200 && publicOffers.data.promotions.find(offer => offer.id === percent)?.products[0].product?.name === rose.name && publicOffers.data.promotions.find(offer => offer.id === percent).products[0].product.images.length > 0);
check("expired/inactive offers are absent from public API", !publicOffers.data.promotions.some(offer => [expired, inactive].includes(offer.id)));

let orderSequence = 0;
async function order(promotion, items, expected, label, extra = {}) {
  const previous = report.orders.find(order => order.label === label);
  if (previous && expected !== null) return { saved: (await rows("orders", query => query.eq("id", previous.id)))[0], phone: previous.phone };
  const phone = `0003${String(network).padStart(2, "0").slice(-2)}${String(++orderSequence).padStart(2, "0")}`;
  const body = { customer_name: `${prefix} cliente`, customer_phone: phone, customer_message: "Método: Retiro en tienda\nTEST PROMO SHOP", idempotency_key: crypto.randomUUID(), promotion_id: promotion, items: items.map(item => ({ product_id: item.id, quantity: item.quantity ?? 1, customization_option_ids: item.options ?? [], message: "TEST tarjeta personalizada" })), ...extra };
  const result = await http("/api/orders", body);
  if (expected === null) { check(label, result.status === 400); return null; }
  check(label, result.status === 201, result.status);
  const saved = (await rows("orders", query => query.eq("id", result.data.order_id)))[0];
  const discounts = await rows("order_discounts", query => query.eq("order_id", saved.id));
  check(`${label}: exact subtotal/discount/total and promotion ID`, Number(saved.subtotal) === expected.subtotal && Number(saved.discount_total) === expected.discount && Number(saved.total) === expected.total && discounts.length === 1 && discounts[0].promotion_id === promotion && Number(discounts[0].amount_applied) === expected.discount);
  report.orders.push({ id: saved.id, number: saved.order_number, phone, label }); save();
  return { saved, phone };
}
const regular = await order(percent, [rose, unrelated], { subtotal: 105, discount: 4.5, total: 100.5 }, "mixed cart percentage only eligible product");
check("pending discounted order does not materialize customer", (await rows("customers", query => query.eq("phone", regular.phone))).length === 0);
const before = await rows("inventory_items", query => query.in("id", Object.values(fixture.items)));
await order(fixed, [{ ...rose, quantity: 2 }], { subtotal: 90, discount: 20, total: 70 }, "fixed discount once despite two units");
await order(combo, [rose, second], { subtotal: 140, discount: 40, total: 100 }, "complete combo");
await order(combo, [rose], null, "incomplete combo rejected by server");
await order(minimum, [rose], null, "unmet minimum rejected by server");
await order(minimum, [{ ...rose, quantity: 2 }, second], { subtotal: 185, discount: 9, total: 176 }, "minimum met on order subtotal");
await order(percent, [unrelated], null, "incompatible promotion rejected");
await order(expired, [rose], null, "expired promotion rejected by server");
await order(inactive, [rose], null, "inactive promotion rejected by server");
await order(explicitCategory, [rose, second, unrelated], { subtotal: 200, discount: 14, total: 186 }, "explicit category participants in mixed cart");
const options = await rows("customization_options", query => query.eq("product_id", rose.id).eq("is_active", true));
if (options.length) {
  const option = options[0], subtotal = Math.round((Number(rose.price) + Number(option.extra_price)) * 100) / 100;
  const discount = Math.round(subtotal * 10) / 100;
  await order(percent, [{ ...rose, options: [option.id] }], { subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100 }, "customized product preserves surcharge and discount");
} else report.checks.push({ name: "HTTP customization surcharge", pass: null, reason: "LAB50 01 has no configured option; pure cart test covers preservation." });
const normalPayment = await http(`/api/orders/${regular.saved.id}/payment`, { customer_phone: regular.phone, qr_slot: "qr_1" });
check("reported payment remains pending", normalPayment.status === 200 && (await rows("payments", query => query.eq("order_id", regular.saved.id)))[0].status === "pendiente");
check("payment report has not consumed inventory", (await rows("inventory_movements", query => query.eq("reference_id", regular.saved.id).eq("movement_type", "salida"))).length === 0);
const confirmed = await http(`/api/admin/payments/${normalPayment.data.payment.id}/confirm`, {}, true);
check("manual confirmation succeeds", confirmed.status === 200);
const confirmedMoves = await rows("inventory_movements", query => query.eq("reference_id", regular.saved.id).eq("movement_type", "salida"));
const requirements = await rows("product_inventory_requirements", query => query.in("product_id", [rose.id, unrelated.id]));
const expectedConsumption = new Map();
for (const line of requirements) expectedConsumption.set(line.inventory_item_id, (expectedConsumption.get(line.inventory_item_id) ?? 0) + Number(line.quantity));
const after = await rows("inventory_items", query => query.in("id", before.map(item => item.id)));
check("confirmation consumes exact eligible and noneligible recipes once", expectedConsumption.size === confirmedMoves.length && [...expectedConsumption].every(([id, quantity]) => Math.abs(Number(before.find(item => item.id === id).current_stock) - Number(after.find(item => item.id === id).current_stock) - quantity) < .00001));
const tracked = await http("/api/orders/track", { order_id: regular.saved.id, customer_phone: regular.phone });
check("confirmed summary includes exact financial amount and private receipt", tracked.status === 200 && Number(tracked.data.order.total) === 100.5 && Boolean(tracked.data.order.receipt_token));
const receipt = await http(`/api/orders/receipt/${tracked.data.order.receipt_token}`);
check("receipt PDF downloads through existing authorization", receipt.status === 200 && receipt.bytes.subarray(0, 5).toString() === "%PDF-");
fs.writeFileSync(path.join(lab, "promotion-shopping-receipt.private.pdf"), receipt.bytes);
const zero = await order(free, [rose], { subtotal: 45, discount: 45, total: 0 }, "100 percent free order");
check("zero total uses existing confirmed flow without payment", zero.saved.status === "confirmado" && (await rows("payments", query => query.eq("order_id", zero.saved.id))).length === 0);
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const range = `from=${date}&to=${date}`;
const dashboard = await http(`/api/admin/dashboard?${range}`, undefined, true);
const sales = await http(`/api/admin/reports/sales?${range}`, undefined, true);
check("Dashboard and reports use the same financial ledger", dashboard.status === 200 && sales.status === 200 && ["gross_sales", "refunds", "net_sales"].every(key => dashboard.data.dashboard.financial[key] === sales.data.summary[key]));
report.finished = new Date().toISOString(); save();
console.log(JSON.stringify({ passed: report.checks.filter(check => check.pass === true).length, pending: report.checks.filter(check => check.pass === null).length, promotionsCreated: report.promotions.length, ordersCreated: report.orders.length }, null, 2));
