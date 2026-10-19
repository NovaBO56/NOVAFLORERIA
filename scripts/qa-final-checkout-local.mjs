// Small additive LOCAL regression. No reset, seed, migration, catalogue/configuration edits or remote target.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

if (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() !== "codex/inventory-refunds-dashboard-2") throw Error("Wrong branch.");
const lab = path.join(process.env.LOCALAPPDATA, "NOVA-Floreria/inventory-refunds-final-replay");
const read = file => JSON.parse(fs.readFileSync(path.join(lab, file), "utf8").replace(/^\uFEFF/, ""));
const cfg = read("status.private.json");
if (cfg.API_URL !== "http://127.0.0.1:62621" || fs.existsSync(path.join(lab, "supabase/.temp/project-ref")) || !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab, "supabase/config.toml"), "utf8"))) throw Error("Existing unlinked LOCAL lab required.");
const prior = read("promotion-shopping-qa.private.json");
const reportFile = path.join(lab, "final-checkout-qa.private.json");
const report = fs.existsSync(reportFile) ? read("final-checkout-qa.private.json") : { checks: [], orders: [], started: new Date().toISOString() };
if (report.finished || report.orders.length) throw Error("Preserve prior results and orders; do not repeat this additive run.");
const save = () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
function check(name, pass) { report.checks.push({ name, pass }); save(); console.log(`${pass ? "PASS" : "FAIL"} ${name}`); if (!pass) throw Error(name); }
const service = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const jar = new Map();
const admin = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
check("real synthetic LOCAL Auth", !(await admin.auth.signInWithPassword(read("admin.credentials.private.json"))).error);
const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
async function http(route, body, staff = false) {
  const response = await fetch("http://127.0.0.1:3116" + route, { redirect: "manual", signal: AbortSignal.timeout(60000), method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", ...(staff ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, location: response.headers.get("location"), data: response.headers.get("content-type")?.includes("json") ? JSON.parse(bytes.toString()) : null, bytes };
}
async function rows(table, filter) { const result = await filter(service.from(table).select("*")); if (result.error) throw Error(`LOCAL read ${table}: ${result.error.code}`); return result.data; }
const catalogue = await http("/api/products?limit=1");
check("100 existing public products preserved", catalogue.status === 200 && catalogue.data.pagination.total === 100);
const productsBefore = (await rows("products", q => q.order("id"))).map(p => ({ id: p.id, name: p.name, price: p.price, is_active: p.is_active, is_available: p.is_available }));
const beforeStock = await rows("inventory_items", q => q.order("id"));
check("home/checkout/tracking respond", (await http("/")).status === 200 && (await http("/checkout")).status === 200 && (await http("/seguimiento")).status === 200);
const internal = await http("/api/visual-preview?path=/api/products");
check("internal visual endpoint is disabled in ordinary LOCAL mode", internal.status === 404 || ([302, 307].includes(internal.status) && new URL(internal.location, "http://127.0.0.1:3116").pathname === "/login"));
const publicOffers = (await http("/api/promotions")).data.promotions;
const promotionId = prior.promotions.find(offer => offer.key === "porcentaje").id;
const offer = publicOffers.find(offer => offer.id === promotionId);
check("participant purchase contract remains public", Boolean(offer?.products?.[0]?.product?.name));
const product = offer.products[0].product;
const subtotal = Number(product.price), discount = Math.round(subtotal * Number(offer.discount_value)) / 100;
const phone = `0006${crypto.randomInt(0, 10000).toString().padStart(4, "0")}`;
const payload = { customer_name: "TEST FINAL CHECKOUT", customer_phone: phone, customer_message: "Método: Retiro en tienda\nTEST FINAL CHECKOUT", promotion_id: promotionId, idempotency_key: crypto.randomUUID(), items: [{ product_id: product.id, quantity: 1, customization_option_ids: [], message: "TEST FINAL CHECKOUT" }] };
const attempts = await Promise.all([http("/api/orders", payload), http("/api/orders", payload)]);
const id = attempts[0].data?.order_id;
if (id) { report.orders.push({ id, phone }); save(); }
check("two simultaneous submissions return one discounted order", attempts.every(attempt => attempt.status === 201 && attempt.data.order_id === id));
const order = (await rows("orders", q => q.eq("id", id)))[0];
report.orders[0].number = order.order_number; save();
check("server financial values and selected offer remain exact", Number(order.subtotal) === subtotal && Number(order.discount_total) === discount && Number(order.total) === subtotal - discount && (await rows("order_discounts", q => q.eq("order_id", id)))[0].promotion_id === promotionId);
check("guest has no materialized customer before confirmation", order.customer_id === null && (await rows("customers", q => q.eq("phone", phone))).length === 0);
const tracked = await http("/api/orders/track", { order_id: id, customer_phone: phone });
check("no receipt before confirmation", tracked.status === 200 && !tracked.data.order.receipt_token);
const qrs = await http("/api/payment-qr");
check("two existing NO PAGAR demonstration QR remain intact", qrs.status === 200 && qrs.data.qrs.length === 2 && qrs.data.qrs.every(qr => /NO PAGAR/.test(qr.account_label)));
const paymentAttempts = await Promise.all([http(`/api/orders/${id}/payment`, { customer_phone: phone, qr_slot: "qr_2" }), http(`/api/orders/${id}/payment`, { customer_phone: phone, qr_slot: "qr_2" })]);
const paymentId = paymentAttempts[0].data?.payment?.id;
check("two reports reuse one pending payment and snapshot QR2", paymentAttempts.every(attempt => attempt.status === 200 && attempt.data.payment.id === paymentId) && (await rows("payments", q => q.eq("order_id", id))).length === 1 && (await rows("payments", q => q.eq("order_id", id)))[0].status === "pendiente");
check("report has not consumed stock", (await rows("inventory_movements", q => q.eq("reference_id", id).eq("movement_type", "salida"))).length === 0);
const confirmations = await Promise.all([http(`/api/admin/payments/${paymentId}/confirm`, {}, true), http(`/api/admin/payments/${paymentId}/confirm`, {}, true)]);
check("two confirmations have one effective result", confirmations.some(attempt => attempt.status === 200) && confirmations.every(attempt => [200, 400].includes(attempt.status)));
const requirements = await rows("product_inventory_requirements", q => q.eq("product_id", product.id));
const movements = await rows("inventory_movements", q => q.eq("reference_id", id).eq("movement_type", "salida"));
const afterStock = await rows("inventory_items", q => q.order("id"));
check("recipe and stock consumed exactly once", requirements.length > 0 && movements.length === requirements.length && requirements.every(requirement => Math.abs(Number(beforeStock.find(item => item.id === requirement.inventory_item_id).current_stock) - Number(afterStock.find(item => item.id === requirement.inventory_item_id).current_stock) - Number(requirement.quantity)) < .00001));
check("no negative stock", afterStock.every(item => Number(item.current_stock) >= 0));
const confirmed = await http("/api/orders/track", { order_id: id, customer_phone: phone });
check("confirmed tracking and receipt preserve exact total", confirmed.status === 200 && confirmed.data.order.status === "confirmado" && Number(confirmed.data.order.total) === subtotal - discount && Boolean(confirmed.data.order.receipt_token));
const pdf = await http(`/api/orders/receipt/${confirmed.data.order.receipt_token}`);
check("authorized receipt remains PDF", pdf.status === 200 && pdf.bytes.subarray(0, 5).toString() === "%PDF-");
const wrong = await http("/api/orders/track", { order_id: id, customer_phone: phone === "00000000" ? "00000001" : "00000000" });
check("incorrect phone has no order or receipt", wrong.status === 404 && !wrong.data.order);
for (const key of ["vencida", "inactiva"]) {
  const bad = prior.promotions.find(offer => offer.key === key).id;
  check(`${key} rejected by real server`, (await http("/api/orders", { ...payload, idempotency_key: crypto.randomUUID(), promotion_id: bad })).status === 400);
}
const freeId = prior.orders.find(order => order.label === "100 percent free order").id;
const freeOrder = (await rows("orders", q => q.eq("id", freeId)))[0];
check("existing free order remains confirmed with no payment", freeOrder.status === "confirmado" && Number(freeOrder.total) === 0 && (await rows("payments", q => q.eq("order_id", freeId))).length === 0);
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dashboard = await http(`/api/admin/dashboard?from=${date}&to=${date}`, undefined, true);
const sales = await http(`/api/admin/reports/sales?from=${date}&to=${date}`, undefined, true);
check("financial ledger remains coherent", dashboard.status === 200 && sales.status === 200 && ["gross_sales", "refunds", "net_sales"].every(key => dashboard.data.dashboard.financial[key] === sales.data.summary[key]));
const productsAfter = (await rows("products", q => q.order("id"))).map(p => ({ id: p.id, name: p.name, price: p.price, is_active: p.is_active, is_available: p.is_available }));
check("no product data changed or deleted", JSON.stringify(productsBefore) === JSON.stringify(productsAfter));
check("final public catalogue remains 100", (await http("/api/products?limit=1")).data.pagination.total === 100);
report.finished = new Date().toISOString(); save();
console.log(JSON.stringify({ passedDistinct: new Map(report.checks.map(check => [check.name, check])).size, ordersCreated: report.orders.map(order => order.number) }));
