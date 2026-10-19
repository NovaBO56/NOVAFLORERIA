// LOCAL-only supplement to the real browser run. Preserves all synthetic business data.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const lab = path.join(process.env.LOCALAPPDATA, "NOVA-Floreria/inventory-refunds-final-replay");
const read = file => JSON.parse(fs.readFileSync(path.join(lab, file), "utf8").replace(/^\uFEFF/, ""));
const cfg = read("status.private.json");
if (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() !== "codex/inventory-refunds-dashboard-2" || cfg.API_URL !== "http://127.0.0.1:62621" || fs.existsSync(path.join(lab, "supabase/.temp/project-ref")) || !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab, "supabase/config.toml"), "utf8"))) throw Error("Unlinked existing LOCAL lab required.");
const service = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function rows(table, filter) { const r = await filter(service.from(table).select("*")); if (r.error) throw Error(`LOCAL read ${table}: ${r.error.code}`); return r.data; }
const file = path.join(lab, "release-readiness-qa.private.json");
if (process.argv.includes("--capture")) {
  if (fs.existsSync(file)) throw Error("Do not overwrite prior evidence.");
  fs.writeFileSync(file, JSON.stringify({ started: new Date().toISOString(), checks: [], orders: [], stockBefore: await rows("inventory_items", q => q.order("id")), productsBefore: await rows("products", q => q.order("id")) }, null, 2));
  console.log("PASS LOCAL baseline captured before browser order."); process.exit(0);
}
const report = read("release-readiness-qa.private.json");
const save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2));
function check(name, pass) { report.checks.push({ name, pass }); save(); console.log(`${pass ? "PASS" : "FAIL"} ${name}`); if (!pass) throw Error(name); }
const outcome = () => ({ passedDistinct: [...new Map(report.checks.map(check => [check.name, check])).values()].filter(check => check.pass).length, failedDistinct: [...new Map(report.checks.map(check => [check.name, check])).values()].filter(check => !check.pass).length, orders: report.orders.map(({ number, kind }) => ({ number, kind })) });
if (process.argv.includes("--verify-free")) {
  const order = (await rows("orders", q => q.eq("guest_phone", "00061924").eq("guest_name", "TEST FINAL RELEASE Gratis")))[0];
  check("browser free order is confirmed with no payment", order && Number(order.total) === 0 && order.status === "confirmado" && (await rows("payments", q => q.eq("order_id", order.id))).length === 0);
  report.orders.push({ id: order.id, number: order.order_number, kind: "browser-free" });
  check("all 100 existing products preserved", JSON.stringify(report.productsBefore) === JSON.stringify(await rows("products", q => q.order("id"))));
  report.finished = new Date().toISOString(); save(); console.log(JSON.stringify(outcome())); process.exit(0);
}
const deliveryOnly = process.argv.includes("--delivery-only");
if (report.confirmedBrowserOrder && !deliveryOnly || report.deliveryOrderCreated) throw Error("Do not repeat confirmations or delivery orders.");
const jar = new Map();
const admin = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
check("real synthetic admin Auth", !(await admin.auth.signInWithPassword(read("admin.credentials.private.json"))).error);
const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
async function http(route, body, staff = false, method = body === undefined ? "GET" : "POST") {
  const r = await fetch("http://127.0.0.1:3116" + route, { method, redirect: "manual", signal: AbortSignal.timeout(60000), headers: { "content-type": "application/json", ...(staff ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, data: await r.json() };
}
const order = (await rows("orders", q => q.eq("guest_phone", "00061922").eq("guest_name", "TEST FINAL RELEASE Combo")))[0];
if (!deliveryOnly) {
check("browser personalized combo recorded exact values", order && Number(order.subtotal) === 145 && Number(order.discount_total) === 40 && Number(order.total) === 105);
report.orders.push({ id: order.id, number: order.order_number, kind: "browser-combo" }); save();
const lines = await rows("order_items", q => q.eq("order_id", order.id));
check("both browser personalizations and option preserved once", lines.length === 2 && lines.some(line => line.message === "TEST FINAL RELEASE componente uno" && Number(line.unit_price_snapshot) === 50 && line.personalization?.length === 1) && lines.some(line => line.message === "TEST FINAL RELEASE componente dos" && Number(line.unit_price_snapshot) === 95));
const payment = (await rows("payments", q => q.eq("order_id", order.id)))[0];
check("reported QR2 is only pending, not confirmed", payment?.status === "pendiente" && payment.qr_slot === "qr_2");
check("guest and stock untouched before manual confirmation", !order.customer_id && (await rows("customers", q => q.eq("phone", "00061922"))).length === 0 && (await rows("inventory_movements", q => q.eq("reference_id", order.id).eq("movement_type", "salida"))).length === 0);
check("manual administrative confirmation succeeds", (await http(`/api/admin/payments/${payment.id}/confirm`, {}, true)).status === 200);
const expected = new Map();
for (const requirement of await rows("product_inventory_requirements", q => q.in("product_id", lines.map(line => line.product_id)))) expected.set(requirement.inventory_item_id, (expected.get(requirement.inventory_item_id) ?? 0) + Number(requirement.quantity));
const optionIds = lines.flatMap(line => (line.personalization ?? []).map(option => option.id));
if (optionIds.length) for (const requirement of await rows("customization_option_inventory_requirements", q => q.in("customization_option_id", optionIds))) expected.set(requirement.inventory_item_id, (expected.get(requirement.inventory_item_id) ?? 0) + Number(requirement.quantity));
const after = await rows("inventory_items", q => q.order("id"));
check("exact inventory consumption including customization", [...expected].every(([id, quantity]) => Math.abs(Number(report.stockBefore.find(row => row.id === id).current_stock) - Number(after.find(row => row.id === id).current_stock) - quantity) < .00001));
const tracked = await http("/api/orders/track", { order_id: order.id, customer_phone: "00061922" });
check("confirmed tracking enables private receipt", tracked.status === 200 && tracked.data.order.status === "confirmado" && Boolean(tracked.data.order.receipt_token));
report.confirmedBrowserOrder = order.id; save();
}
const setting = (await rows("system_settings", q => q.eq("key", "delivery_enabled")))[0];
const deliveryProduct = (await rows("order_items", q => q.eq("order_id", order.id)))[0];
const body = { customer_name: "TEST FINAL RELEASE Entrega", customer_phone: "00061923", customer_message: "Método: Entrega por coordinar\nDirección sintética LOCAL para la prueba", items: [{ product_id: deliveryProduct.product_id, quantity: 1 }], idempotency_key: crypto.randomUUID() };
try {
  check("disable delivery through admin API", (await http("/api/admin/system-settings?key=delivery_enabled", { value: { enabled: false } }, true, "PATCH")).status === 200);
  const before = (await rows("orders", q => q.eq("idempotency_key", body.idempotency_key))).length;
  const blocked = await http("/api/orders", body);
  check("server rejects delivery without creating a partial order", blocked.status === 409 && blocked.data.code === "DELIVERY_UNAVAILABLE" && (await rows("orders", q => q.eq("idempotency_key", body.idempotency_key))).length === before);
  check("enable delivery through admin API", (await http("/api/admin/system-settings?key=delivery_enabled", { value: { enabled: true } }, true, "PATCH")).status === 200);
  const normal = await http("/api/orders", body);
  check("ordinary product with enabled delivery creates order", normal.status === 201);
  const delivery = (await rows("orders", q => q.eq("id", normal.data.order_id)))[0];
  report.orders.push({ id: delivery.id, number: delivery.order_number, kind: "normal-delivery" }); report.deliveryOrderCreated = delivery.id; save();
} finally {
  const restored = await http("/api/admin/system-settings?key=delivery_enabled", { value: setting.value }, true, "PATCH");
  check("original LOCAL delivery configuration restored", restored.status === 200 && JSON.stringify(restored.data.setting.value) === JSON.stringify(setting.value));
}
console.log(JSON.stringify(outcome()));
