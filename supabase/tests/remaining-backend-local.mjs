// Pruebas reales de HTTP/Auth/PostgreSQL. Solo NOVA-LOCAL-VALIDATION desechable.
// Variables: NOVA_LOCAL_LAB (carpeta privada), NOVA_LOCAL_HTTP (localhost:3100).
// Requiere Next en ejecución y configuración privada exportada por Supabase local.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const lab = process.env.NOVA_LOCAL_LAB;
if (!lab || path.basename(lab) !== 'NOVA-LOCAL-VALIDATION') throw Error('Laboratorio local explícito requerido');
if (fs.existsSync(path.join(lab, 'supabase/.temp/project-ref'))) throw Error('No usar proyecto vinculado');
const config = JSON.parse(fs.readFileSync(path.join(lab, '.env-local-status.private.json'), 'utf8').replace(/^\uFEFF/, ''));
if (config.API_URL !== 'http://127.0.0.1:55421') throw Error('Destino incorrecto');
const http = process.env.NOVA_LOCAL_HTTP || 'http://127.0.0.1:3100';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(http)) throw Error('HTTP debe ser localhost');
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const service = createClient(config.API_URL, config.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(config.API_URL, config.ANON_KEY, { auth: { persistSession: false } });
const label = 'TEST REMAINING ' + crypto.randomUUID().slice(0, 8);
const report = { label, target: config.API_URL, cases: [], fixtures: [], errors: [], rollback: 'supabase db reset --local --workdir NOVA-LOCAL-VALIDATION --yes (solo laboratorio desechable)' };
const users = {};
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
async function sql(statement) {
  const { stdout } = await run('docker', ['exec', 'supabase_db_NOVA-LOCAL-VALIDATION', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', statement]);
  return stdout.trim();
}
const json = async statement => JSON.parse(await sql(statement));
function check(name, condition, details) {
  report.cases.push({ name, passed: Boolean(condition), details });
  console.log(name, condition ? 'PASS' : 'FAIL');
}
async function api(route, role = 'anon', body, method = body ? 'POST' : 'GET', isForm = false) {
  const response = await fetch(http + route, {
    method, redirect: 'manual', headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...(users[role] ? { Cookie: users[role].cookie } : {}), 'x-forwarded-for': '198.18.0.77' },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = { html: text.slice(0, 100) }; }
  return { status: response.status, data };
}
async function test(name, route, role, body, expected, method, isForm) {
  const result = await api(route, role, body, method, isForm);
  check(name, result.status === expected, result);
  return result.data;
}
async function staff(role, active) {
  const email = `${label.replaceAll(' ', '-').toLowerCase()}-${role}@example.invalid`;
  const password = crypto.randomBytes(24).toString('hex');
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: label + ' ' + role } });
  if (error) throw error;
  const id = data.user.id;
  await sql(`UPDATE profiles SET role=${quote(role === 'admin' ? 'administrador' : 'empleado')},is_active=${active} WHERE id=${quote(id)}`);
  const jar = new Map();
  const client = createServerClient(config.API_URL, config.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: items => items.forEach(item => jar.set(item.name, item.value)) } });
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  users[role] = { id, client, cookie: [...jar].map(([key, value]) => key + '=' + value).join('; ') };
  report.fixtures.push({ table: 'auth.users/profiles', id, email, active });
  check('Auth real ' + role, !!login.data.session, { id, active });
}
const authSql = body => `BEGIN;SET LOCAL request.jwt.claim.sub=${quote(users.admin.id)};SET LOCAL request.jwt.claims=${quote(JSON.stringify({ sub: users.admin.id, role: 'authenticated' }))};SET LOCAL ROLE authenticated;${body};COMMIT;`;
async function session(body) {
  const began = Date.now();
  try { const output = await sql(body); return { ok: true, ms: Date.now() - began, output }; }
  catch (error) { return { ok: false, ms: Date.now() - began, error: error.stderr || error.message }; }
}
async function pair(name, first, second, state, assertion) {
  const a = session(first); await new Promise(resolve => setTimeout(resolve, 100));
  const b = session(second); await new Promise(resolve => setTimeout(resolve, 200));
  const waiting = await json("SELECT coalesce(json_agg(json_build_object('pid',pid,'wait',wait_event_type,'blockers',pg_blocking_pids(pid))),'[]') FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid))>0");
  const sessions = await Promise.all([a, b]); const final = await json(state);
  check(name, assertion(sessions, final), { sessions, waiting, final });
}
try {
  for (const [role, active] of [['admin', true], ['employee', true], ['inactive', false]]) await staff(role, active);
  for (const role of ['employee', 'inactive']) {
    for (const route of ['payment-qr', 'whatsapp-config', 'business-hours', 'system-settings', 'audit-log']) await test(role + ' config denied ' + route, '/api/admin/' + route, role, null, 403);
    for (const [name, args] of [['consume_inventory_adjustment', { p_item: crypto.randomUUID(), p_quantity: 1, p_lot: null, p_type: 'merma', p_reference: crypto.randomUUID(), p_reason: label, p_actor: users[role].id }], ['check_rate_limit', { p_ip: label, p_route: 'createOrder', p_max_attempts: 10, p_window_seconds: 300 }], ['set_checkout_configuration', { p_actor: users.admin.id, p_kind: 'whatsapp', p_active: false }]]) {
      const result = await users[role].client.rpc(name, args); check(role + ' helper denied ' + name, result.error?.code === '42501', { code: result.error?.code });
    }
  }
  for (const name of ['consume_inventory_adjustment', 'check_rate_limit']) {
    const args = name === 'check_rate_limit' ? { p_ip: label, p_route: 'createOrder', p_max_attempts: 10, p_window_seconds: 300 } : { p_item: crypto.randomUUID(), p_quantity: 1, p_lot: null, p_type: 'merma', p_reference: crypto.randomUUID(), p_reason: label, p_actor: users.admin.id };
    const result = await anon.rpc(name, args); check('anon helper denied ' + name, result.error?.code === '42501', { code: result.error?.code });
  }
  const directOrder = await anon.rpc('create_order', { p_customer_name: label, p_customer_phone: '70000077', p_customer_whatsapp: null, p_items: [], p_customer_message: null, p_idempotency_key: label, p_promotion_id: null });
  check('anon cannot bypass API limiter via create_order RPC', directOrder.error?.code === '42501', { code: directOrder.error?.code });
  await test('QR deactivate', '/api/admin/payment-qr', 'admin', { is_active: false }, 200, 'PATCH');
  await test('QR missing', '/api/payment-qr', 'anon', null, 404);
  await test('WhatsApp deactivate', '/api/admin/whatsapp-config', 'admin', { is_active: false }, 200, 'PATCH');
  await test('WhatsApp missing', '/api/whatsapp-config', 'anon', null, 404);
  await test('WhatsApp invalid', '/api/admin/whatsapp-config', 'admin', { phone_number: '+abc' }, 400);
  await test('WhatsApp save', '/api/admin/whatsapp-config', 'admin', { phone_number: '59170000077' }, 201);
  await test('WhatsApp public', '/api/whatsapp-config', 'anon', null, 200);
  const sharp = require('sharp');
  const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#ffffff' } }).png().toBuffer();
  for (const [name, bytes, expected] of [['false-type', Buffer.from('<script>'), 400], ['truncated-image', Buffer.from([137,80,78,71,13,10,26,10]), 400], ['empty', Buffer.alloc(0), 400], ['oversize', Buffer.alloc(5 * 1024 * 1024 + 1), 400], ['synthetic-image', png, 201], ['replace', png, 201]]) {
    const form = new FormData(); form.append('file', new Blob([bytes], { type: 'image/png' }), name + '.php'); form.append('account_label', label);
    const result = await test('QR ' + name, '/api/admin/payment-qr', 'admin', form, expected, 'POST', true);
    if (result.qr_config?.id) report.fixtures.push({ table: 'payment_qr_config/storage.objects', id: result.qr_config.id, path: result.qr_config.qr_storage_path });
  }
  await test('QR public configured', '/api/payment-qr', 'anon', null, 200);
  check('One QR active / generated PNG path', await sql("SELECT count(*) FROM payment_qr_config WHERE is_active AND qr_storage_path LIKE '%.png'") === '1');
  await test('invalid hour', '/api/admin/business-hours/0', 'admin', { opens_at: '25:90' }, 400, 'PATCH');
  await test('setting wrong type', '/api/admin/system-settings?key=accept_orders_outside_hours', 'admin', { value: { enabled: 'true' } }, 400, 'PATCH');
  for (let day = 0; day < 7; day++) await test('hours day ' + day, '/api/admin/business-hours/' + day, 'admin', { is_closed: true }, 200, 'PATCH');
  await test('outside hours off', '/api/admin/system-settings/accept-orders-outside-hours', 'admin', { enabled: false }, 200, 'PATCH');
  const itemResult = await test('inventory item', '/api/admin/inventory/items', 'employee', { name: label, item_type: 'flor' }, 201);
  const item = itemResult.item.id;
  const productResult = await test('product', '/api/admin/products', 'employee', { name: 'AAA ' + label, price: 100 }, 201);
  const product = productResult.product.id;
  report.fixtures.push({ table: 'inventory_items/products', item, product });
  const category = await test('category create', '/api/admin/categories', 'employee', { name: label }, 201);
  const season = await test('season create', '/api/admin/seasons', 'employee', { name: label, starts_at: '2026-01-01', ends_at: '2026-12-31' }, 201);
  await test('product category/season association', `/api/admin/products/${product}`, 'employee', { category_id: category.category.id, season_id: season.season.id }, 200, 'PATCH');
  const image = new FormData(); image.append('file', new Blob([png], { type: 'image/png' }), 'test-product.png');
  await test('product image processed/uploaded', `/api/admin/products/${product}/images`, 'employee', image, 201, 'POST', true);
  await test('public product detail', `/api/products/${product}`, 'anon', null, 200);
  await test('recipe', `/api/admin/products/${product}/inventory-requirements`, 'employee', { inventory_item_id: item, quantity: 1 }, 201);
  await test('entry', '/api/admin/inventory/entries', 'employee', { inventory_item_id: item, quantity: 10 }, 201);
  await test('reopen day without hours blocked', '/api/admin/business-hours/0', 'admin', { is_closed: false }, 400, 'PATCH');
  await test('open valid day', '/api/admin/business-hours/0', 'admin', { is_closed: false, opens_at: '09:00', closes_at: '18:00' }, 200, 'PATCH');
  await test('close day', '/api/admin/business-hours/0', 'admin', { is_closed: true }, 200, 'PATCH');
  const customization = await test('customization option', `/api/admin/products/${product}/customization-options`, 'employee', { option_type: 'color', name: label + ' color', value: 'TEST violeta', extra_price: 0 }, 201);
  const payload = { customer_name: label, customer_phone: '70000077', items: [{ product_id: product, quantity: 1 }], idempotency_key: label + '-online' };
  await test('closed hours block', '/api/orders', 'anon', payload, 400);
  await test('outside hours on', '/api/admin/system-settings/accept-orders-outside-hours', 'admin', { enabled: true }, 200, 'PATCH');
  await test('positive adjustment', '/api/admin/inventory/adjustments', 'employee', { inventory_item_id: item, quantity_delta: 5, reason: label }, 201);
  await test('negative adjustment', '/api/admin/inventory/adjustments', 'employee', { inventory_item_id: item, quantity_delta: -2, reason: label }, 201);
  await test('FIFO waste without lot', '/api/admin/inventory/waste', 'employee', { inventory_item_id: item, quantity: 1, reason: label }, 201);
  const stockState = () => `SELECT json_build_object('stock',(SELECT current_stock FROM inventory_items WHERE id=${quote(item)}),'lots',(SELECT sum(remaining_quantity) FROM inventory_lots WHERE inventory_item_id=${quote(item)}))`;
  const stock = await json(stockState()); check('FIFO stock equals lot sum', Number(stock.stock) === 12 && Number(stock.lots) === 12, stock);
  const wrongLot = await sql(`SELECT id FROM inventory_lots WHERE inventory_item_id<>${quote(item)} LIMIT 1`);
  if (wrongLot) await test('wrong item lot rejected', '/api/admin/inventory/waste', 'employee', { inventory_item_id: item, lot_id: wrongLot, quantity: 1, reason: label }, 400);
  const order = await test('normal checkout', '/api/orders', 'anon', payload, 201);
  report.fixtures.push({ table: 'orders', id: order.order_id });
  await test('cannot waste reserved stock', '/api/admin/inventory/waste', 'employee', { inventory_item_id: item, quantity: 12, reason: label }, 400);
  await test('cannot adjust reserved stock', '/api/admin/inventory/adjustments', 'employee', { inventory_item_id: item, quantity_delta: -12, reason: label }, 400);
  const payment = await test('report payment', `/api/orders/${order.order_id}/payment`, 'anon', { customer_phone: payload.customer_phone }, 200);
  await test('confirm payment', `/api/admin/payments/${payment.payment.id}/confirm`, 'employee', {}, 200);
  for (const status of ['en_preparacion', 'listo', 'finalizado']) await test('advance ' + status, `/api/admin/orders/${order.order_id}/status`, 'employee', { new_status: status }, 200);
  await test('tracking', '/api/orders/track', 'anon', { order_id: order.order_id, customer_phone: payload.customer_phone }, 200);
  const register = await sql('SELECT id FROM cash_registers LIMIT 1');
  const oldSessions = await json("SELECT coalesce(json_agg(id),'[]') FROM cash_sessions WHERE status='abierta'");
  for (const id of oldSessions) await sql(authSql(`SELECT public.close_cash_session(${quote(id)},0,${quote(label)})`));
  await test('closed cash sale', '/api/admin/sales', 'employee', { items: payload.items, payment_method: 'efectivo' }, 400);
  await pair('concurrent cash opening', authSql(`SELECT public.open_cash_session(${quote(register)},0);SELECT pg_sleep(0.6)`), authSql(`SELECT public.open_cash_session(${quote(register)},0)`), `SELECT json_build_object('open',count(*)) FROM cash_sessions WHERE cash_register_id=${quote(register)} AND status='abierta'`, (sessions, state) => sessions.filter(s => s.ok).length === 1 && state.open === 1);
  const sale = await test('physical discounted sale', '/api/admin/sales', 'employee', { items: payload.items, payment_method: 'efectivo', manual_discount_amount: 10, manual_discount_reason: label }, 201);
  const saleId = sale.sale.id;
  await test('employee return denied', `/api/admin/orders/${saleId}/returns`, 'employee', { type: 'devolucion', amount: 90, reason: label }, 403);
  await test('physical return', `/api/admin/orders/${saleId}/returns`, 'admin', { type: 'devolucion', amount: 90, reason: label }, 201);
  const state = await json(`SELECT json_build_object('refund',(SELECT sum(amount) FROM cash_movements WHERE order_id=${quote(saleId)} AND movement_type='devolucion'),'stock',(SELECT current_stock FROM inventory_items WHERE id=${quote(item)}),'lots',(SELECT sum(remaining_quantity) FROM inventory_lots WHERE inventory_item_id=${quote(item)}))`);
  check('physical return stock and cash atomic', Number(state.refund) === 90 && Number(state.stock) === 11 && Number(state.lots) === 11, state);
  await test('duplicate return blocked', `/api/admin/orders/${saleId}/returns`, 'admin', { type: 'devolucion', amount: 90, reason: label }, 400);
  const freeSale = await test('free physical sale', '/api/admin/sales', 'employee', { items: payload.items, payment_method: 'efectivo', manual_discount_amount: 100, manual_discount_reason: label }, 201);
  if (freeSale.sale?.id) {
    const free = await json(`SELECT json_build_object('status',(SELECT status FROM orders WHERE id=${quote(freeSale.sale.id)}),'payments',(SELECT count(*) FROM payments WHERE order_id=${quote(freeSale.sale.id)}),'cash',(SELECT count(*) FROM cash_movements WHERE order_id=${quote(freeSale.sale.id)}))`);
    check('free physical no fictitious payment/cash', free.status === 'finalizado' && free.payments === 0 && free.cash === 0, free);
  }
  const openSession = await sql(`SELECT id FROM cash_sessions WHERE cash_register_id=${quote(register)} AND status='abierta'`);
  const saleCall = `SELECT id FROM public.create_physical_sale(${quote(JSON.stringify(payload.items))}::jsonb,NULL,NULL,NULL,NULL,'efectivo')`;
  await pair('sale commits before concurrent cash close', authSql(saleCall + ';SELECT pg_sleep(0.6)'), authSql(`SELECT public.close_cash_session(${quote(openSession)},100,${quote(label)})`), `SELECT json_build_object('status',status,'expected',expected_amount) FROM cash_sessions WHERE id=${quote(openSession)}`, (sessions, state) => sessions.every(s => s.ok) && state.status === 'cerrada' && Number(state.expected) === 100);
  const newSession = await sql(authSql(`SELECT public.open_cash_session(${quote(register)},0)`));
  const sessionId = newSession.split('\n').find(line => /^[0-9a-f-]{36}$/.test(line));
  await pair('cash close wins and blocks sale', authSql(`SELECT public.close_cash_session(${quote(sessionId)},0,${quote(label)});SELECT pg_sleep(0.6)`), authSql(saleCall), `SELECT json_build_object('status',status,'movements',(SELECT count(*) FROM cash_movements WHERE cash_session_id=${quote(sessionId)})) FROM cash_sessions WHERE id=${quote(sessionId)}`, (sessions, state) => sessions[0].ok && !sessions[1].ok && !sessions[1].error.includes('deadlock') && state.status === 'cerrada' && state.movements === 0);
  const qrCash = await test('open cash for QR sale', '/api/admin/cash-sessions', 'employee', { cash_register_id: register, opening_amount: 0 }, 201);
  const qrSale = await test('QR physical sale', '/api/admin/sales', 'employee', { items: payload.items, payment_method: 'qr' }, 201);
  const beforeRefund = await sql(`SELECT current_stock FROM inventory_items WHERE id=${quote(item)}`);
  await test('QR monetary refund', `/api/admin/orders/${qrSale.sale.id}/returns`, 'admin', { type: 'reintegro', amount: 15, reason: label }, 201);
  check('monetary refund does not restore product', await sql(`SELECT current_stock FROM inventory_items WHERE id=${quote(item)}`) === beforeRefund);
  await test('close QR-only cash', `/api/admin/cash-sessions/${qrCash.session_id}/close`, 'employee', { counted_amount: 0, closing_note: label }, 200);
  check('QR refund excluded from physical cash count', await sql(`SELECT expected_amount FROM cash_sessions WHERE id=${quote(qrCash.session_id)}`) === '0.00');
  await test('customer duplicate phone', '/api/admin/customers', 'employee', { name: label, phone: payload.customer_phone }, 409);
  await test('customer search', '/api/admin/customers?search=70000077', 'employee', null, 200);
  await test('deactivate employee', `/api/admin/users/${users.employee.id}/status`, 'admin', { is_active: false }, 200, 'PATCH');
  await test('existing session blocked after deactivation', '/api/admin/inventory/items', 'employee', null, 403);
  await test('reactivate employee', `/api/admin/users/${users.employee.id}/status`, 'admin', { is_active: true }, 200, 'PATCH');
  await test('employee cannot elevate role', `/api/admin/users/${users.employee.id}/role`, 'employee', { role: 'administrador' }, 403, 'PATCH');
  await sql(`BEGIN;UPDATE profiles SET is_active=false WHERE role='administrador' AND id<>${quote(users.admin.id)};DO $$ BEGIN BEGIN UPDATE profiles SET is_active=false WHERE id=${quote(users.admin.id)};RAISE EXCEPTION 'TEST: last admin protection missing' USING ERRCODE='XX000';EXCEPTION WHEN raise_exception THEN NULL;END;END;$$;ROLLBACK;`);
  check('last active admin protected (transaction rolled back)', true);
  const newEmail = `${label.replaceAll(' ', '-').toLowerCase()}-api@example.invalid`;
  const created = await test('admin creates active employee', '/api/admin/users/create', 'admin', { email: newEmail, password: crypto.randomBytes(24).toString('hex'), full_name: label + ' API user', role: 'empleado' }, 201);
  if (created.user?.id) report.fixtures.push({ table: 'auth.users/profiles', id: created.user.id, email: newEmail });
  check('profile mutation audit actor', await sql(`SELECT count(*) FROM audit_logs WHERE table_name='profiles' AND user_id=${quote(users.admin.id)}`) !== '0');
  const personalized = await test('personalized checkout HTTP', '/api/orders', 'anon', { ...payload, idempotency_key: label + '-custom', items: [{ product_id: product, quantity: 1, customization_option_ids: [customization.option.id], customer_message: label }] }, 201);
  if (personalized.order_id) report.fixtures.push({ table: 'orders', id: personalized.order_id, kind: 'personalized' });
  await test('invalid report date', '/api/admin/reports/sales?from=2026-02-30&to=2026-03-31', 'employee', null, 400);
  for (const route of ['dashboard', 'notifications', 'audit-log', 'categories', 'seasons', 'products', 'customers', 'promotions', 'inventory/lots', 'inventory/movements', 'cash-sessions']) await test('read ' + route, '/api/admin/' + route, route === 'audit-log' ? 'admin' : 'employee', null, 200);
  const notifications = await api('/api/admin/notifications?unread=true', 'employee');
  if (notifications.data.notifications?.[0]) await test('notification read', `/api/admin/notifications/${notifications.data.notifications[0].id}/read`, 'employee', {}, 200);
  check('sensitive audit events present', Number(await sql(`SELECT count(*) FROM audit_logs WHERE table_name IN ('inventory_adjustments','inventory_waste','payment_qr_config','whatsapp_config','cash_movements','sale_returns')`)) >= 10);
  for (const route of ['sales', 'cash', 'inventory', 'customers', 'products-sold', 'waste', 'cancellations']) await test('report ' + route, `/api/admin/reports/${route}?from=2026-01-01&to=2027-01-01&format=json`, 'employee', null, 200);
  await test('configuration page', '/admin/configuracion', 'admin', null, 200);
  await test('audit page', '/admin/auditoria', 'admin', null, 200);
  check('old payment absent and server-only ACL', await sql("SELECT to_regprocedure('public.create_payment(uuid)') IS NULL AND NOT has_function_privilege('anon','public.create_payment(uuid,text)','EXECUTE') AND NOT has_function_privilege('authenticated','public.create_payment(uuid,text)','EXECUTE') AND has_function_privilege('service_role','public.create_payment(uuid,text)','EXECUTE')") === 't');
} catch (error) { report.errors.push({ message: error.message }); console.error('PHASE ERROR', error.message); }
finally {
  fs.mkdirSync(path.join(lab, 'certification'), { recursive: true });
  fs.writeFileSync(path.join(lab, 'certification/REMAINING_BACKEND.private.json'), JSON.stringify(report, null, 2));
  const failures = report.cases.filter(item => !item.passed).length;
  console.log('SUMMARY', JSON.stringify({ cases: report.cases.length, failures, errors: report.errors }));
  if (failures || report.errors.length) process.exitCode = 1;
}
