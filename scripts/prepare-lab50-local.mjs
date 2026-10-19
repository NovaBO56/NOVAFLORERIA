/** Additive, resumable LOCAL fixture preparation. Never a seed for production. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import sharp from "sharp";
import { LAB_PREFIX, LAB_VERSION, categories, inventoryItems, products } from "./lab50-catalog.mjs";

const mode = process.argv[2];
if (!["--prepare", "--verify"].includes(mode)) throw Error("Use --prepare or --verify. Fixed existing LOCAL laboratory only.");
const repo = process.cwd();
if (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() !== "codex/inventory-refunds-dashboard-2") throw Error("Wrong branch; no actions performed.");
const lab = path.join(process.env.LOCALAPPDATA ?? "", "NOVA-Floreria", "inventory-refunds-final-replay");
if (!path.isAbsolute(lab) || path.resolve(lab).startsWith(path.resolve(repo) + path.sep)) throw Error("Private directory outside repository required.");
const cfg = JSON.parse(fs.readFileSync(path.join(lab, "status.private.json"), "utf8"));
if (cfg.API_URL !== "http://127.0.0.1:62621" || fs.existsSync(path.join(lab, "supabase/.temp/project-ref"))) throw Error("Unlinked LOCAL Supabase required.");
if (!/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab, "supabase/config.toml"), "utf8"))) throw Error("Unexpected laboratory identity.");
const accessFile = path.join(lab, "lab50-access.private.json");
const access = fs.existsSync(accessFile) ? JSON.parse(fs.readFileSync(accessFile, "utf8")) : { webUrl: "http://127.0.0.1:3116", supabaseUrl: cfg.API_URL };
const localAddresses = new Set(["127.0.0.1", "localhost", ...Object.values(os.networkInterfaces()).flat().filter(Boolean).map(value => value.address)]);
function localUrl(value, port) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !localAddresses.has(url.hostname) || url.port !== String(port) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw Error("Target must be this computer and the fixed LOCAL port.");
  return url.origin;
}
function isCurrentLocalStorageUrl(value) {
  try { return localUrl(new URL(value).origin, 62621).length > 0; } catch { return false; }
}
const app = localUrl(access.webUrl, 3116), authUrl = localUrl(access.supabaseUrl, 62621);
const service = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const file = path.join(lab, "lab50-results.private.json");
const report = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { version: LAB_VERSION, categories: {}, items: {}, products: {}, entries: [], operations: {}, returns: {}, checks: [], anchor: new Date().toISOString() };
if (report.version !== LAB_VERSION) throw Error("Fixture version conflict.");
const save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2));
const sqlQuote = value => "'" + String(value).replaceAll("'", "''") + "'";
const sql = text => execFileSync("docker", ["exec", "-i", "supabase_db_NOVA-LOCAL-INTEGRITY", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"], { input: text, encoding: "utf8", timeout: 60000 }).trim();
function check(name, pass) { report.checks.push({ name, pass, at: new Date().toISOString() }); save(); console.log(`${pass ? "PASS" : "FAIL"} ${name}`); if (!pass) throw Error(name); }
async function rows(table, filter) { let query = service.from(table).select("*"); if (filter) query = filter(query); const result = await query; if (result.error) throw Error(`LOCAL read ${table}: ${result.error.code}`); return result.data; }
async function one(table, column, value) { const data = await rows(table, query => query.eq(column, value)); if (data.length > 1) throw Error(`Duplicate fixture in ${table}`); return data[0] ?? null; }
async function rpc(client, name, args) { const result = await client.rpc(name, args); if (result.error) throw Error(`LOCAL RPC ${name}: ${result.error.message}`); return result.data; }
const credentialFile = path.join(lab, "admin.credentials.private.json");
const credential = JSON.parse(fs.readFileSync(credentialFile, "utf8"));
if (!credential.email?.endsWith("@example.invalid") || typeof credential.password !== "string") throw Error("Existing synthetic LOCAL admin credential required.");
const jar = new Map();
const admin = createServerClient(authUrl, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
const login = await admin.auth.signInWithPassword(credential);
if (login.error) throw Error("LOCAL synthetic login failed; credentials not logged.");
const profile = await one("profiles", "id", login.data.user.id);
if (profile?.role !== "administrador" || !profile.is_active) throw Error("Active laboratory administrator required.");
const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
async function http(route, body, method = body === undefined ? "GET" : "POST", authenticated = true) {
  if (!route.startsWith("/api/")) throw Error("Only local application APIs are allowed.");
  const form = body instanceof FormData;
  const response = await fetch(app + route, { method, redirect: "error", signal: AbortSignal.timeout(60000), headers: { ...(form ? {} : { "Content-Type": "application/json" }), ...(authenticated ? { cookie } : {}) }, body: body === undefined ? undefined : form ? body : JSON.stringify(body) });
  const data = response.headers.get("content-type")?.includes("json") ? await response.json() : null;
  if (!response.ok || (data && !data.success)) throw Error(`LOCAL ${method} ${route}: ${response.status} ${data?.message ?? "request failed"}`);
  return { data, status: response.status, response };
}
const oldOrders = await rows("orders");
// Physical fixtures have no public idempotency key. Exclude the known fixture IDs on a resumed run.
const ownedIds = new Set(Object.values(report.operations).map(value => value.id));
const preserved = oldOrders.filter(order => !ownedIds.has(order.id) && !order.idempotency_key?.startsWith("LAB50-"));
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const previous = new Map(preserved.map(order => [order.id, digest(order)]));
check("protected orders 27/28/29 present", [27, 28, 29].every(number => preserved.some(order => order.order_number === number)));
const expiredPrior = sql(`SELECT count(*) FROM inventory_reservations WHERE status='reserved' AND expires_at<now() AND order_id IN(${preserved.map(order => sqlQuote(order.id)).join(",")});`);
check("no prior expired reservations would be changed by order creation", expiredPrior === "0");
const webProfile = (await http("/api/admin-check")).data;
check("Next validates the same LOCAL Auth administrator", webProfile.user?.id === profile.id && webProfile.user?.role === "administrador");

function stamp(days) {
  // Anchor to the store's calendar date, not UTC's next date after 20:00 in Bolivia.
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en", { timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(report.anchor)).map(part => [part.type, part.value]));
  const date = new Date(`${parts.year}-${parts.month}-${parts.day}T16:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}
function uuidFor(label) { const hex = crypto.createHash("sha256").update(`${LAB_PREFIX}-${LAB_VERSION}-${label}`).digest("hex").slice(0, 32); return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`; }
function demoImage(code, qr = false) {
  const colors = ["#b9a6df", "#d59daf", "#d4b76c", "#99b9a3", "#adacd8"];
  const color = colors[Number(code.replace(/\D/g, "")) % colors.length];
  const petals = [0, 60, 120, 180, 240, 300].map(angle => `<ellipse cx="300" cy="210" rx="42" ry="74" fill="${color}" opacity=".8" transform="rotate(${angle} 300 280)"/>`).join("");
  return sharp(Buffer.from(`<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" rx="32" fill="#faf8fd"/><rect x="22" y="22" width="556" height="556" rx="26" fill="none" stroke="#dfd4eb" stroke-width="3"/>${qr ? '<path d="M250 150h100v150H250z" fill="#eee8fa"/><path d="M265 165l70 120m0-120l-70 120" stroke="#74599f" stroke-width="8"/>' : petals + '<circle cx="300" cy="280" r="38" fill="#f2dde8"/><path d="M300 325v80m0-35c-40-50-85-20-85-20 20 40 55 45 85 20" stroke="#99b9a3" fill="#dde9df" stroke-width="9"/>'}<text x="300" y="82" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#604581">FLORISTERÍA ANABELLE · LABORATORIO</text><text x="300" y="455" text-anchor="middle" font-family="sans-serif" font-size="${qr ? 33 : 27}" font-weight="bold" fill="#604581">${qr ? "NO PAGAR" : code}</text><text x="300" y="503" text-anchor="middle" font-family="sans-serif" font-size="23" fill="#604581">DEMOSTRACIÓN</text><text x="300" y="541" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#6c6278">${qr ? "No contiene datos bancarios ni un QR real" : "Ilustración de prueba · No es una foto real"}</text></svg>`)).png().toBuffer();
}

if (mode === "--prepare") {
  for (const category of categories) {
    let row = await one("categories", "name", category.name);
    if (!row) row = (await http("/api/admin/categories", { name: category.name, description: category.description })).data.category;
    report.categories[category.key] = row.id; save();
  }
  for (const item of inventoryItems) {
    let row = await one("inventory_items", "sku", item.sku);
    if (!row) row = (await http("/api/admin/inventory/items", { name: item.name, sku: item.sku, item_type: item.item_type, unit: item.unit, minimum_stock: item.minimum_stock })).data.item;
    report.items[item.key] = row.id; save();
    for (const [lot, fraction] of [[1, .75], [2, .25]]) {
      const notes = `${LAB_PREFIX}-v${LAB_VERSION}-entry-${item.sku}-${lot}`;
      let entry = await one("inventory_entries", "notes", notes);
      if (!entry) entry = (await http("/api/admin/inventory/entries", { inventory_item_id: row.id, quantity: item.entry_quantity * fraction, unit_cost: item.item_type === "flor" ? 4 : 2, supplier_name: "LAB50 Proveedor sintético", notes, received_at: stamp(lot === 1 ? 30 : 29) })).data.entry;
      if (!report.entries.includes(entry.id)) report.entries.push(entry.id); save();
    }
  }
  // Preserve earlier synthetic QA rows but keep the public catalog at the
  // requested 100 saleable products. No real-looking row is changed.
  const earlierQaProducts = await rows("products", query => query.like("name", "TEST %"));
  for (const product of earlierQaProducts) if (product.is_active || product.is_available) {
    await http(`/api/admin/products/${product.id}`, { is_active: false, is_available: false }, "PATCH");
  }
  for (const [index, product] of products.entries()) {
    let row = report.products[product.code] ? await one("products", "id", report.products[product.code]) : await one("products", "name", product.name);
    if (!row) row = (await http("/api/admin/products", { name: product.name, description: product.description, price: product.price, category_id: report.categories[product.categoryKey], occasion: product.occasion, catalog_order: index + 1, is_featured: index % 5 === 0, is_active: false, is_available: false })).data.product;
    else if (row.name !== product.name || row.description !== product.description || Number(row.price) !== product.price || row.category_id !== report.categories[product.categoryKey]) {
      row = (await http(`/api/admin/products/${row.id}`, { name: product.name, description: product.description, price: product.price, category_id: report.categories[product.categoryKey], occasion: product.occasion, catalog_order: index + 1 }, "PATCH")).data.product;
    }
    report.products[product.code] = row.id; save();
    for (const line of product.recipe) {
      const existing = await rows("product_inventory_requirements", query => query.eq("product_id", row.id).eq("inventory_item_id", report.items[line.itemKey]));
      if (!existing.length) await http(`/api/admin/products/${row.id}/inventory-requirements`, { inventory_item_id: report.items[line.itemKey], quantity: line.quantity });
      else if (existing.length !== 1 || Number(existing[0].quantity) !== line.quantity) throw Error(`Recipe conflict ${product.code}; no silent overwrite.`);
    }
    const images = await rows("product_images", query => query.eq("product_id", row.id));
    if (!images.length) { const form = new FormData(); form.set("file", new Blob([await demoImage(product.code)], { type: "image/png" }), `${product.code} Ilustración de demostración no fotografía real.png`); await http(`/api/admin/products/${row.id}/images`, form); }
    else for (const image of images) {
      if (isCurrentLocalStorageUrl(image.public_url)) continue;
      const oldUrl = new URL(image.public_url);
      if (!oldUrl.pathname.startsWith("/storage/v1/object/public/product-images/")) throw Error(`Unexpected product image origin for ${product.code}`);
      const replacement = authUrl + oldUrl.pathname;
      const updated = await service.from("product_images").update({ public_url: replacement }).eq("id", image.id);
      if (updated.error) throw Error(`Could not repair LOCAL-only product image URL for ${product.code}`);
    }
    if (!row.is_active || !row.is_available) await http(`/api/admin/products/${row.id}`, { is_active: true, is_available: true }, "PATCH");
    console.log(`Prepared ${product.code}`);
  }
  for (const slot of ["qr_1", "qr_2"]) {
    const latest = (await rows("payment_qr_config", query => query.eq("qr_slot", slot).order("created_at", { ascending: false }).limit(1)))[0];
    const label = `NO PAGAR / DEMOSTRACIÓN · QR ${slot.at(-1)}`;
    if (latest?.account_label !== label || !isCurrentLocalStorageUrl(latest?.qr_public_url)) { const form = new FormData(); form.set("file", new Blob([await demoImage(slot, true)], { type: "image/png" }), "no-pagar-demostracion.png"); form.set("qr_slot", slot); form.set("account_label", label); form.set("is_active", "true"); await http("/api/admin/payment-qr", form); }
    else if (!latest.is_active) await http("/api/admin/payment-qr", { qr_slot: slot, is_active: true }, "PATCH");
  }
  // Disable only the LOCAL integration so manual tests cannot accidentally open a real conversation.
  await http("/api/admin/whatsapp-config", { is_active: false }, "PATCH");
  for (const [key, percent, eligible] of [["ten", 10, products.slice(0, 5)], ["free", 100, products.slice(0, 1)]]) {
    const name = key === "free" ? "LAB50 · Gratis producto 01" : "LAB50 · Rosas 10 por ciento";
    let promotion = await one("promotions", "name", name);
    if (!promotion) promotion = (await http("/api/admin/promotions", { name, description: "Promoción sintética de laboratorio; no es una oferta real.", promotion_type: "producto", discount_type: "porcentaje", discount_value: percent, is_active: true })).data.promotion;
    report[key === "free" ? "freePromotion" : "tenPromotion"] = promotion.id; save();
    for (const product of eligible) if (!(await rows("promotion_products", query => query.eq("promotion_id", promotion.id).eq("product_id", report.products[product.code]))).length) await http(`/api/admin/promotions/${promotion.id}/products`, { product_id: report.products[product.code] });
  }
  let register = await one("cash_registers", "name", "LAB50 · Caja demostración");
  // Register creation is configuration bootstrap (no public write policy/API).
  // All sales, sessions and returns still use the authenticated business APIs.
  if (!register) { const result = await service.from("cash_registers").insert({ name: "LAB50 · Caja demostración" }).select().single(); if (result.error) throw Error(`LOCAL register configuration: ${result.error.code}`); register = result.data; }
  report.register = register.id; save();
  const labSessions = await rows("cash_sessions", query => query.eq("cash_register_id", register.id));
  const labMovements = labSessions.length ? await rows("cash_movements", query => query.in("cash_session_id", labSessions.map(session => session.id))) : [];
  const sessionWithMovements = labSessions.find(session => labMovements.some(movement => movement.cash_session_id === session.id));
  if (sessionWithMovements) report.session = sessionWithMovements.id;
  else if (!report.session) { const open = labSessions.filter(session => session.status === "abierta"); report.session = open[0]?.id ?? (await http("/api/admin/cash-sessions", { cash_register_id: register.id, opening_amount: 500 })).data.session_id; }
  save();

  const paidDays = [0, 1, 3, 5, 6, 8, 10, 12, 15, 19, 23, 27];
  for (let index = 0; index < 30; index++) {
    const key = String(index + 1).padStart(2, "0");
    if (report.operations[key]?.complete) continue;
    const physical = index >= 24, free = index === 22 || index === 23;
    const productIndex = free ? 0 : index === 8 ? 3 : index === 17 ? 4 : (index * 2) % 50;
    const product = products[productIndex], productId = report.products[product.code];
    const phone = `000250${key}`, name = `LAB50 Cliente ${key}`, pickup = (index >= 12 && index <= 14) || index % 2 === 0;
    const promotion = free ? report.freePromotion : [8, 17].includes(index) ? report.tenPromotion : null;
    let operation = report.operations[key];
    if (!operation) {
      let order;
      if (physical) {
        let customer = await one("customers", "phone", phone);
        if (customer && customer.name !== name) throw Error("Synthetic phone conflict; no customer overwritten.");
        if (!customer) customer = (await http("/api/admin/customers", { name, phone })).data.customer;
        const existing = await rows("orders", query => query.eq("customer_id", customer.id).eq("order_type", "fisica"));
        if (existing.length > 1) throw Error("Duplicate physical fixture; stop.");
        order = existing[0] ?? (await http("/api/admin/sales", { items: [{ product_id: productId, quantity: 1 }], customer_id: customer.id, payment_method: index % 2 === 0 ? "efectivo" : "qr" })).data.sale;
      } else {
        const existingCustomer = await one("customers", "phone", phone);
        if (existingCustomer && existingCustomer.name !== name) throw Error("Synthetic phone conflict; no customer overwritten.");
        const id = await rpc(service, "create_order", { p_customer_name: name, p_customer_phone: phone, p_customer_whatsapp: null, p_items: [{ product_id: productId, quantity: 1, customization_option_ids: [], message: "LAB50 · Tarjeta de demostración" }], p_customer_message: `Método: ${pickup ? "Retiro en tienda" : "Entrega por coordinar"}\nLAB50 · Simulación sin entrega real${pickup ? "" : "\nDirección sintética de laboratorio, sin destino real"}`, p_idempotency_key: `LAB50-v${LAB_VERSION}-order-${key}`, p_promotion_id: promotion });
        order = await one("orders", "id", id);
      }
      if (!order?.id) throw Error(`No order for fixture ${key}`);
      operation = { id: order.id, number: order.order_number, phone, name, physical, productCode: product.code, days: physical ? [0, 2, 6, 12, 20, 27][index - 24] : index < 6 ? 0 : index < 18 ? paidDays[index - 6] : index === 22 ? 2 : index === 23 ? 16 : [1, 4, 4, 18][index - 18] };
      report.operations[key] = operation; save();
    }
    let order = await one("orders", "id", operation.id);
    if (!physical && !free && index >= 3 && index !== 20 && index !== 21) {
      const existingPayment = await one("payments", "order_id", order.id);
      const payment = existingPayment ?? await rpc(service, "report_payment_qr", { p_order_id: order.id, p_customer_phone: phone, p_qr_slot: index % 2 === 0 ? "qr_1" : "qr_2" });
      operation.payment = (Array.isArray(payment) ? payment[0] : payment).id; save();
      if (index >= 18 && index <= 19) {
        if (order.status !== "rechazado") await http(`/api/admin/payments/${operation.payment}/reject`, { reason: "LAB50 · Rechazo simulado, sin transferencia real" });
      } else if (index >= 6 && order.status === "pendiente_pago") {
        const before = index === 6 ? await rows("inventory_items", query => query.in("id", product.recipe.map(line => report.items[line.itemKey]))) : [];
        await http(`/api/admin/payments/${operation.payment}/confirm`, {});
        if (index === 6) { const after = await rows("inventory_items", query => query.in("id", before.map(item => item.id))); check("confirmed sale consumes every recipe component once", product.recipe.every(line => { const id = report.items[line.itemKey]; return Math.abs(Number(before.find(item => item.id === id).current_stock) - Number(after.find(item => item.id === id).current_stock) - line.quantity) < .00001; })); }
      }
    }
    if (index === 20 || index === 21) { if (order.status !== "cancelado") await http(`/api/admin/orders/${order.id}/cancel`, { reason: "LAB50 · Cancelación de demostración" }); }
    const desired = physical ? "finalizado" : index < 9 || index >= 18 && index !== 23 ? null : index < 12 ? "en_preparacion" : index < 15 ? "listo" : "finalizado";
    if (desired) { order = await one("orders", "id", order.id); const stages = ["confirmado", "en_preparacion", "listo", "finalizado"]; for (let current = stages.indexOf(order.status); current >= 0 && current < stages.indexOf(desired); current++) await http(`/api/admin/orders/${order.id}/status`, { new_status: stages[current + 1] }); }
    operation.complete = true; save(); console.log(`Prepared operation ${key} (#${operation.number})`);
  }
  for (const [key, type, fraction] of [["25", "reintegro", .25], ["26", "reintegro", 1], ["27", "devolucion", 1], ["28", "reintegro", .3], ["28", "retorno_fisico", 0]]) {
    const order = await one("orders", "id", report.operations[key].id);
    const amount = Math.round(Number(order.total) * fraction * 100) / 100;
    const reason = `LAB50 · ${type} simulado, sin dinero real`;
    const existing = (await rows("sale_returns", query => query.eq("order_id", order.id).eq("type", type))).find(record => record.reason === reason);
    if (existing && (Number(existing.amount) !== amount || existing.idempotency_key !== uuidFor(`return-${key}-${type}`))) throw Error(`Return fixture conflict ${key}-${type}; no silent overwrite.`);
    const returnId = existing?.id ?? (await http(`/api/admin/orders/${order.id}/returns`, { type, amount, reason, idempotency_key: uuidFor(`return-${key}-${type}`) })).data.return_id;
    report.returns[`${key}-${type}`] = returnId; save();
  }
  // Only timestamp fixture history; money, stock and states came from the real business flows.
  const productIds = Object.values(report.products).map(sqlQuote).join(","), itemIds = Object.values(report.items).map(sqlQuote).join(","), entryIds = report.entries.map(sqlQuote).join(",");
  let history = `BEGIN; UPDATE products SET created_at=${sqlQuote(stamp(29))},updated_at=${sqlQuote(stamp(29))} WHERE id IN(${productIds}); UPDATE inventory_items SET created_at=${sqlQuote(stamp(30))} WHERE id IN(${itemIds}); UPDATE inventory_entries SET created_at=received_at WHERE id IN(${entryIds}); UPDATE inventory_lots SET created_at=received_at WHERE inventory_entry_id IN(${entryIds}); UPDATE inventory_movements SET created_at=(SELECT received_at FROM inventory_entries WHERE id=reference_id) WHERE reference_type='inventory_entry' AND reference_id IN(${entryIds}); UPDATE cash_sessions SET opened_at=${sqlQuote(stamp(29))},created_at=${sqlQuote(stamp(29))} WHERE id=${sqlQuote(report.session)};`;
  for (const [key, operation] of Object.entries(report.operations)) {
    if (Number(key) <= 6) continue; // Keep live pending reservations current.
    const id = sqlQuote(operation.id), at = sqlQuote(stamp(operation.days));
    // Free-order automatic movements have no human actor. Their validation trigger
    // intentionally prevents later updates; keep their original creation dates.
    history += `UPDATE orders SET created_at=${at}::timestamptz,updated_at=${at}::timestamptz+interval '10 minutes',cancelled_at=CASE WHEN cancelled_at IS NULL THEN NULL ELSE ${at}::timestamptz+interval '3 minutes' END WHERE id=${id}; UPDATE payments SET created_at=${at}::timestamptz+interval '1 minute',updated_at=${at}::timestamptz+interval '2 minutes',confirmed_at=CASE WHEN confirmed_at IS NULL THEN NULL ELSE ${at}::timestamptz+interval '2 minutes' END,rejected_at=CASE WHEN rejected_at IS NULL THEN NULL ELSE ${at}::timestamptz+interval '2 minutes' END WHERE order_id=${id}; UPDATE inventory_reservations SET created_at=${at},expires_at=${at}::timestamptz+interval '30 minutes',released_at=CASE WHEN released_at IS NULL THEN NULL ELSE ${at}::timestamptz+interval '2 minutes' END WHERE order_id=${id}; UPDATE inventory_movements SET created_at=${at}::timestamptz+CASE WHEN movement_type='salida' THEN interval '2 minutes' ELSE interval '10 minutes' END WHERE reference_type='order' AND reference_id=${id} AND created_by IS NOT NULL; UPDATE order_discounts SET created_at=${at} WHERE order_id=${id}; UPDATE sale_returns SET created_at=${at}::timestamptz+interval '10 minutes' WHERE order_id=${id}; UPDATE cash_movements SET created_at=${at}::timestamptz+CASE WHEN movement_type='venta' THEN interval '2 minutes' ELSE interval '10 minutes' END WHERE order_id=${id};`;
  }
  sql(history + "COMMIT;"); report.historyPrepared = true; save();
  const fixtureCash = await rows("cash_movements", query => query.eq("cash_session_id", report.session));
  const cashExpected = 500 + fixtureCash.filter(movement => movement.payment_method === "efectivo").reduce((sum, movement) => sum + (movement.movement_type === "venta" ? 1 : -1) * Number(movement.amount), 0);
  check("fixture cash reconciliation before closing", fixtureCash.length === 10 && Math.abs(cashExpected - 967.5) < .00001);
  const historicalSession = await one("cash_sessions", "id", report.session);
  if (historicalSession.status === "abierta") await http(`/api/admin/cash-sessions/${report.session}/close`, { counted_amount: cashExpected, closing_note: "LAB50 · Cierre sintético conciliado; no dinero real" });
  // Leave a NEW, most recently opened session for manual sales, without closing
  // or reordering any preexisting register/session owned by earlier fixtures.
  if (!report.manualSession) {
    const open = await rows("cash_sessions", query => query.eq("cash_register_id", report.register).eq("status", "abierta"));
    report.manualSession = open.find(session => session.id !== report.session)?.id ?? (await http("/api/admin/cash-sessions", { cash_register_id: report.register, opening_amount: 500 })).data.session_id;
    save();
  }

  // Extend the additive fixture to 50 operations while preserving the original
  // 30-operation financial reference set. Every transition still uses the real
  // business RPC/API; no status is written directly.
  for (let index = 30; index < 50; index++) {
    const key = String(index + 1).padStart(2, "0");
    if (report.operations[key]?.complete) continue;
    const free = index >= 48;
    const product = free ? products[0] : products[50 + (index - 30)], productId = report.products[product.code];
    const phone = `000250${key}`, name = `LAB50 Cliente ${key}`, pickup = index % 2 === 0;
    let operation = report.operations[key];
    if (!operation) {
      const id = await rpc(service, "create_order", {
        p_customer_name: name,
        p_customer_phone: phone,
        p_customer_whatsapp: null,
        p_items: [{ product_id: productId, quantity: 1, customization_option_ids: [], message: "LAB50 · Tarjeta de demostración" }],
        p_customer_message: `Método: ${pickup ? "Retiro en tienda" : "Entrega por coordinar"}\nLAB50 · Simulación sin entrega real${pickup ? "" : "\nDirección sintética de laboratorio, sin destino real"}`,
        p_idempotency_key: `LAB50-v${LAB_VERSION}-order-${key}`,
        p_promotion_id: free ? report.freePromotion : null,
      });
      const order = await one("orders", "id", id);
      operation = { id: order.id, number: order.order_number, phone, name, physical: false, productCode: product.code, days: 0 };
      report.operations[key] = operation; save();
    }
    let order = await one("orders", "id", operation.id);
    if (index >= 34 && index <= 45 && !free) {
      const existingPayment = await one("payments", "order_id", order.id);
      const payment = existingPayment ?? await rpc(service, "report_payment_qr", { p_order_id: order.id, p_customer_phone: phone, p_qr_slot: index % 2 === 0 ? "qr_1" : "qr_2" });
      operation.payment = (Array.isArray(payment) ? payment[0] : payment).id; save();
      if (index >= 44) {
        if (order.status !== "rechazado") await http(`/api/admin/payments/${operation.payment}/reject`, { reason: "LAB50 · Rechazo simulado, sin transferencia real" });
      } else if (index >= 38 && order.status === "pendiente_pago") {
        await http(`/api/admin/payments/${operation.payment}/confirm`, {});
      }
    }
    if (index === 46 || index === 47) {
      if (order.status !== "cancelado") await http(`/api/admin/orders/${order.id}/cancel`, { reason: "LAB50 · Cancelación de demostración" });
    }
    const desired = index === 39 ? "en_preparacion" : index === 40 ? "listo" : index >= 41 && index <= 43 || index === 49 ? "finalizado" : null;
    if (desired) {
      order = await one("orders", "id", order.id);
      const stages = ["confirmado", "en_preparacion", "listo", "finalizado"];
      for (let current = stages.indexOf(order.status); current >= 0 && current < stages.indexOf(desired); current++) await http(`/api/admin/orders/${order.id}/status`, { new_status: stages[current + 1] });
    }
    operation.complete = true; save(); console.log(`Prepared operation ${key} (#${operation.number})`);
  }
  let deliveryStatusVisible = false, deliveryBlocked = false;
  const orderCountBeforeDeliveryProbe = (await rows("orders")).length;
  try {
    await http("/api/admin/system-settings?key=delivery_enabled", { value: { enabled: false } }, "PATCH");
    const publicStatus = (await http("/api/business-hours", undefined, "GET", false)).data.status;
    deliveryStatusVisible = publicStatus.delivery_enabled === false;
    const blocked = await fetch(`${app}/api/orders`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: "LAB50 Entrega bloqueada", customer_phone: "00025998", items: [{ product_id: report.products[products[0].code], quantity: 1 }], customer_message: "Método: Entrega por coordinar\nLAB50 · No crear", idempotency_key: uuidFor("delivery-disabled-probe") }),
    });
    const blockedBody = await blocked.json();
    deliveryBlocked = blocked.status === 409 && blockedBody.code === "DELIVERY_UNAVAILABLE" && (await rows("orders")).length === orderCountBeforeDeliveryProbe;
  } finally {
    await http("/api/admin/system-settings?key=delivery_enabled", { value: { enabled: true } }, "PATCH");
  }
  check("delivery switch is exposed by the public status API", deliveryStatusVisible);
  check("disabled delivery is rejected by the real HTTP order API without mutation", deliveryBlocked);
  check("delivery switch is restored after the probe", (await http("/api/business-hours", undefined, "GET", false)).data.status.delivery_enabled === true);
}

const catalog = await rows("products", query => query.like("name", "LAB50 %"));
check("exactly 100 distinct LAB50 products", catalog.length === 100 && new Set(catalog.map(product => product.name)).size === 100);
check("all 100 have valid category and saleable flags", catalog.every(product => product.category_id && product.is_active && product.is_available && Number(product.price) > 0));
const newItemIds = Object.values(report.items), requirements = await rows("product_inventory_requirements", query => query.in("product_id", catalog.map(product => product.id)));
check("all products have complete recipes", products.every(product => product.recipe.every(line => requirements.some(requirement => requirement.product_id === report.products[product.code] && requirement.inventory_item_id === report.items[line.itemKey] && Number(requirement.quantity) === line.quantity))));
const catalogImages = await rows("product_images", query => query.in("product_id", catalog.map(product => product.id)));
check("all 100 products have a LOCAL demonstration image", catalog.every(product => catalogImages.some(image => image.product_id === product.id && isCurrentLocalStorageUrl(image.public_url))));
const stock = await rows("inventory_items", query => query.in("id", newItemIds)), lots = await rows("inventory_lots", query => query.in("inventory_item_id", newItemIds)), movements = await rows("inventory_movements", query => query.in("inventory_item_id", newItemIds));
check("24 lots and 12 inventory items", stock.length === 12 && lots.length === 24);
check("stock reconciles against lots and movements", stock.every(item => { const incoming = movements.filter(movement => movement.inventory_item_id === item.id && movement.movement_type !== "salida").reduce((sum, movement) => sum + Number(movement.quantity), 0); const outgoing = movements.filter(movement => movement.inventory_item_id === item.id && movement.movement_type === "salida").reduce((sum, movement) => sum + Number(movement.quantity), 0); const remaining = lots.filter(lot => lot.inventory_item_id === item.id).reduce((sum, lot) => sum + Number(lot.remaining_quantity), 0); return Number(item.current_stock) >= 0 && Math.abs(Number(item.current_stock) - remaining) < .00001 && Math.abs(Number(item.current_stock) - incoming + outgoing) < .00001; }));
const ops = Object.entries(report.operations).sort(([a], [b]) => Number(a) - Number(b)).map(([, operation]) => operation), ids = ops.map(operation => operation.id);
const orders = await rows("orders", query => query.in("id", ids)), payments = await rows("payments", query => query.in("order_id", ids)), returns = await rows("sale_returns", query => query.in("order_id", ids));
check("50 unique simulated operations", orders.length === 50 && new Set(ids).size === 50);
check("fixture order dates are not in the future", orders.every(order => new Date(order.created_at).getTime() <= Date.now()));
check("pending orders did not consume stock or materialize customers", (await rows("customers", query => query.in("phone", ops.slice(0, 6).map(operation => operation.phone)))).length === 0 && !movements.some(movement => movement.movement_type === "salida" && ops.slice(0, 6).some(operation => operation.id === movement.reference_id)));
check("free orders confirmed without payment", ["23", "24"].every(key => { const order = orders.find(order => order.id === report.operations[key].id); return ["confirmado", "en_preparacion", "listo", "finalizado"].includes(order.status) && Number(order.total) === 0 && !payments.some(payment => payment.order_id === order.id); }));
check("five idempotent returns with two physical restorations", returns.length === 5 && returns.filter(record => ["devolucion", "retorno_fisico"].includes(record.type)).length === 2);
const cashMovements = await rows("cash_movements", query => query.in("order_id", ids));
check("physical sales and monetary refunds reconcile in their own cash session", cashMovements.length === 10 && cashMovements.every(movement => movement.cash_session_id === report.session) && ops.filter(operation => operation.physical).every(operation => {
  const payment = payments.find(payment => payment.order_id === operation.id && payment.status === "confirmado");
  const sale = cashMovements.filter(movement => movement.order_id === operation.id && movement.movement_type === "venta");
  return payment && sale.length === 1 && Number(sale[0].amount) === Number(payment.amount) && sale[0].payment_method === payment.method;
}) && returns.filter(record => Number(record.amount) > 0).every(record => cashMovements.some(movement => movement.order_id === record.order_id && movement.movement_type === "devolucion" && Number(movement.amount) === Number(record.amount))));
const closedCash = await one("cash_sessions", "id", report.session);
check("historical cash closed with zero discrepancy", closedCash.status === "cerrada" && Number(closedCash.expected_amount) === 967.5 && Number(closedCash.counted_amount) === 967.5 && Number(closedCash.difference_amount) === 0);
const openSessions = (await http("/api/admin/cash-sessions?status=abierta")).data.sessions;
check("manual sales have the new LAB50 session available", openSessions.some(session => session.id === report.manualSession));
const referenceIds = new Set(ops.slice(0, 30).map(operation => operation.id));
const gross = payments.filter(payment => referenceIds.has(payment.order_id) && payment.status === "confirmado").reduce((sum, payment) => sum + Number(payment.amount), 0), refund = returns.reduce((sum, record) => sum + Number(record.amount), 0);
check("original LAB50 paid sales reconcile with refunds", Math.abs(gross - 5083) < .00001 && Math.abs(refund - 431.5) < .00001);
report.financial = { gross, refunds: refund, net: gross - refund, historicalCashExpected: Number(closedCash.expected_amount), cashDiscrepancy: Number(closedCash.difference_amount) };
for (const [label, days] of [["today", 0], ["7 days", 6], ["30 days", 29]]) {
  const to = stamp(0).slice(0, 10), from = stamp(days).slice(0, 10), range = `from=${from}&to=${to}`;
  const sales = (await http(`/api/admin/reports/sales?${range}`)).data;
  const dashboard = (await http(`/api/admin/dashboard?${range}`)).data;
  check(`dashboard equals reports ${label}`, ["gross_sales", "refunds", "net_sales"].every(key => dashboard.dashboard.financial[key] === sales.summary[key]));
  report.ranges ??= {}; report.ranges[label] = sales.summary;
}
for (const key of ["04", "07", "19", "23"]) {
  const operation = report.operations[key];
  const tracked = await rpc(service, "track_order_details", { p_customer_phone: operation.phone, p_order_number: operation.number, p_order_id: null });
  const order = Array.isArray(tracked) ? tracked[0] : tracked;
  check(`tracking receipt contract ${key}`, key === "07" ? Boolean(order.receipt_token) : !order.receipt_token);
  const publicOrder = (await http("/api/orders/track", { order_number: operation.number, customer_phone: operation.phone }, "POST", false)).data.order;
  check(`public HTTP tracking contract ${key}`, publicOrder.id === operation.id && publicOrder.status === order.status && Boolean(publicOrder.receipt_token) === Boolean(order.receipt_token));
  if (key === "07") {
    const receipt = await fetch(`${app}/api/orders/receipt/${order.receipt_token}`, { redirect: "error", signal: AbortSignal.timeout(60000) });
    check("confirmed order receipt is a private PDF", receipt.status === 200 && receipt.headers.get("content-type") === "application/pdf" && receipt.headers.get("cache-control")?.includes("no-store") && Buffer.from(await receipt.arrayBuffer()).subarray(0, 4).toString() === "%PDF");
  }
}
const wrongPhone = await fetch(`${app}/api/orders/track`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_number: report.operations["07"].number, customer_phone: "00000099" }), redirect: "error", signal: AbortSignal.timeout(60000) });
const wrongPhoneBody = await wrongPhone.json();
check("wrong phone cannot retrieve order or receipt token", wrongPhone.status === 404 && !wrongPhoneBody.order && !JSON.stringify(wrongPhoneBody).includes("receipt_token"));
const pendingReceipt = await fetch(`${app}/api/orders/receipt/${report.operations["04"].id}`, { redirect: "error", signal: AbortSignal.timeout(60000) });
check("pending order ID cannot authorize a public receipt", pendingReceipt.status === 404);
const after = new Map((await rows("orders", query => query.in("id", [...previous.keys()]))).map(order => [order.id, digest(order)]));
check("all preexisting orders preserved byte-for-byte", [...previous].every(([id, hash]) => after.get(id) === hash));
const qrs = (await http("/api/payment-qr", undefined, "GET", false)).data.qrs;
check("both QR are explicitly NO PAGAR demonstrations", qrs.length === 2 && qrs.every(qr => qr.account_label.includes("NO PAGAR") && qr.account_label.includes("DEMOSTRACIÓN")));
for (const qr of qrs) {
  localUrl(new URL(qr.qr_public_url).origin, 62621);
  const response = await fetch(qr.qr_public_url, { redirect: "error", signal: AbortSignal.timeout(60000) });
  const image = response.ok ? await sharp(Buffer.from(await response.arrayBuffer())).metadata() : {};
  check(`${qr.qr_slot} demo image available through LAN Storage`, response.status === 200 && image.width > 0 && image.height > 0);
}
report.summary = { products: catalog.length, operations: orders.length, confirmedPaidSales: payments.filter(payment => payment.status === "confirmado").length, freeOrders: orders.filter(order => Number(order.total) === 0).length, monetaryReturns: returns.filter(record => Number(record.amount) > 0).length, physicalReturns: returns.filter(record => ["devolucion", "retorno_fisico"].includes(record.type)).length, returnRecords: returns.length, inventoryItems: stock.length, lots: lots.length, priorOrdersPreserved: previous.size, web: app, supabase: authUrl };
save();
fs.writeFileSync(path.join(lab, "LAB50-GUIA-PRIVADA.md"), `# Laboratorio sintético LAB50\n\nWeb Wi-Fi: ${app}\nWeb en esta PC: http://127.0.0.1:3116\nAdmin: ${app}/login\nCredenciales existentes: abrir localmente admin.credentials.private.json; no compartir ni subir.\nQR1 y QR2: NO PAGAR. WhatsApp LOCAL desactivado; no se envían mensajes.\n\n|Pedido|Celular de prueba|Cliente|\n|---|---|---|\n${ops.map(operation => `|${operation.number}|${operation.phone}|${operation.name}|`).join("\n")}\n\nPara comprar: LAB50 01, nombre LAB50 Visitante, celular 00025999; sin promoción para probar aviso/confirmación. Para total cero: producto LAB50 01 y promoción LAB50 · Gratis producto 01.\nDespués de reportar: entrar a admin/pedidos, buscar el número y confirmar en el detalle. Volver a seguimiento y pulsar Actualizar. Preparación → Listo → Finalizado; descargar comprobante solo tras confirmar.\n`);
console.log(JSON.stringify(report.summary, null, 2));
