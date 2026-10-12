// Directed functional QA, synthetic fixtures in the dedicated unlinked LOCAL lab.
// Outputs and credentials must remain outside the repository.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import sharp from 'sharp';
const [privateDir] = process.argv.slice(2);
if (!privateDir || path.resolve(privateDir).startsWith(path.resolve(process.cwd()))) throw Error('Private output outside Git required');
const cfg = JSON.parse(fs.readFileSync(path.join(privateDir, 'status.private.json'), 'utf8'));
if (cfg.API_URL !== 'http://127.0.0.1:59621' || fs.existsSync(path.join(privateDir, 'supabase/.temp/project-ref'))) throw Error('Isolated lab guard');
const app = 'http://127.0.0.1:3114';
const output = path.join(privateDir, 'qr-results.private.json');
const previous = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : null;
const report = { checks: [], created: previous?.created || [], app, supabase: cfg.API_URL };
const check = (name, pass, details) => { report.checks.push({ name, pass, details }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); if (!pass) throw Error('LOCAL QA failed: ' + name); };
const sql = text => execFileSync('docker', ['exec', 'supabase_db_NOVA-LOCAL-TWO-QR', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', text], { encoding: 'utf8', timeout: 30000 }).trim();
const admin = createClient(cfg.API_URL, cfg.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const cookie = {};
for (const [role, dbRole] of [['admin', 'administrador'], ['employee', 'empleado']]) {
  let credential = { email: `two-qr-${role}-${crypto.randomUUID()}@example.invalid`, password: crypto.randomBytes(24).toString('base64url') };
  const credentialPath = path.join(privateDir, `${role}.credentials.private.json`);
  if (fs.existsSync(credentialPath)) credential = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
  const prior = fs.existsSync(credentialPath) ? await createClient(cfg.API_URL, cfg.ANON_KEY, { auth: { persistSession: false } }).auth.signInWithPassword(credential) : null;
  const created = prior || await admin.auth.admin.createUser({ ...credential, email_confirm: true, user_metadata: { full_name: `TEST TWO QR ${role}` } });
  if (created.error) throw Error('Synthetic auth bootstrap failed');
  const profile = await admin.from('profiles').update({ role: dbRole, is_active: true }).eq('id', created.data.user.id);
  if (profile.error) throw Error('Synthetic profile bootstrap failed');
  if (!report.created.some(row => row.id === created.data.user.id)) report.created.push({ kind: 'auth-user', id: created.data.user.id });
  fs.writeFileSync(path.join(privateDir, `${role}.credentials.private.json`), JSON.stringify(credential));
  const jar = new Map();
  const client = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
  const login = await client.auth.signInWithPassword(credential); check(`real Auth ${role}`, !login.error);
  cookie[role] = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}
async function http(route, body, role = 'anon', method = body === undefined ? 'GET' : 'POST') {
  const form = body instanceof FormData;
  const response = await fetch(app + route, { method, redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { ...(form ? {} : { 'content-type': 'application/json' }), ...(cookie[role] ? { cookie: cookie[role] } : {}) }, body: body === undefined ? undefined : form ? body : JSON.stringify(body) });
  return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null };
}
const product = crypto.randomUUID(), item = crypto.randomUUID();
sql(`INSERT INTO inventory_items(id,name,item_type) VALUES('${item}','TEST TWO QR HTTP STOCK','flor'); INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES('${item}',20,'${report.created[0].id}'); INSERT INTO products(id,name,price) VALUES('${product}','TEST TWO QR HTTP PRODUCT',100); INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES('${product}','${item}',1); UPDATE system_settings SET value='{"enabled":true}' WHERE key='accept_orders_outside_hours';`);
report.created.push({ kind: 'product', id: product }, { kind: 'inventory-item', id: item });
const png = await sharp({ create: { width: 240, height: 240, channels: 3, background: '#f2e5ff' } }).png().toBuffer();
fs.writeFileSync(path.join(privateDir, 'synthetic-qr.png'), png);
async function upload(slot, label, active = true) { const body = new FormData(); body.set('file', new Blob([png], { type: 'image/png' }), 'synthetic-qr.png'); body.set('qr_slot', slot); body.set('account_label', label); body.set('is_active', String(active)); return http('/api/admin/payment-qr', body, 'admin'); }
const toggle = (slot, active) => http('/api/admin/payment-qr', { qr_slot: slot, is_active: active }, 'admin', 'PATCH');
const order = async phone => { const result = await http('/api/orders', { customer_name: 'TEST TWO QR HTTP CUSTOMER', customer_phone: phone, idempotency_key: crypto.randomUUID(), items: [{ product_id: product, quantity: 1 }] }); check('real checkout order', result.status === 201, { status: result.status }); report.created.push({ kind: 'order', id: result.data.order_id }); return result.data.order_id; };
const track = (id, phone) => http('/api/orders/track', { order_id: id, customer_phone: phone });
check('no active QR safe 404', (await http('/api/payment-qr')).status === 404);
check('employee cannot configure QR', (await http('/api/admin/payment-qr', { qr_slot: 'qr_1', is_active: false }, 'employee', 'PATCH')).status === 403);
check('anon cannot configure QR', [403, 307].includes((await http('/api/admin/payment-qr', { qr_slot: 'qr_1', is_active: false }, 'anon', 'PATCH')).status));
for (const slot of ['qr_1', 'qr_2']) {
  const result = await upload(slot, 'TEST HTTP ' + slot); check('upload ' + slot, result.status === 201 && result.data.qr_config.qr_slot === slot, { status: result.status });
}
check('both public QRs', (await http('/api/payment-qr')).data.qrs.length === 2);
await toggle('qr_2', false); const one = await http('/api/payment-qr'); check('only QR1 active', one.data.qrs.length === 1 && one.data.qrs[0].qr_slot === 'qr_1');
await toggle('qr_1', false); await toggle('qr_2', true); const two = await http('/api/payment-qr'); check('only QR2 active', two.data.qrs.length === 1 && two.data.qrs[0].qr_slot === 'qr_2');
await toggle('qr_1', true);
const normal = await order('00012101');
const missing = await http(`/api/orders/${normal}/payment`, { customer_phone: '00012101' }); check('both require explicit selection', missing.status === 400);
check('no partial payment', sql(`SELECT count(*) FROM payments WHERE order_id='${normal}'`) === '0');
const wrong = await http(`/api/orders/${normal}/payment`, { customer_phone: '00012102', qr_slot: 'qr_2' }); check('wrong phone', wrong.status === 404);
const pay = await http(`/api/orders/${normal}/payment`, { customer_phone: '00012101', qr_slot: 'qr_2', qr_label: 'untrusted', status: 'confirmado' });
check('pending report with trusted snapshot', pay.status === 200 && pay.data.payment.status === 'pendiente' && pay.data.payment.qr_label === 'TEST HTTP qr_2', { status: pay.status });
report.created.push({ kind: 'payment', id: pay.data.payment.id });
check('no early customer', sql("SELECT count(*) FROM customers WHERE phone='00012101'") === '0');
check('no permanent consumption', sql(`SELECT current_stock FROM inventory_items WHERE id='${item}'`) === '20.000');
const before = await track(normal, '00012101'); check('pending snapshot, no receipt', before.status === 200 && !before.data.order.receipt_token && before.data.order.reported_qr.qr_slot === 'qr_2');
await http('/api/admin/payment-qr', { qr_slot: 'qr_2', account_label: 'TEST RENAMED' }, 'admin', 'PATCH'); await toggle('qr_2', false);
const retry = await http(`/api/orders/${normal}/payment`, { customer_phone: '00012101', qr_slot: 'qr_2' }); check('retry preserves reported QR after rename/deactivation', retry.status === 200 && retry.data.payment.id === pay.data.payment.id && retry.data.payment.qr_label === 'TEST HTTP qr_2');
check('no duplicate payments', sql(`SELECT count(*) FROM payments WHERE order_id='${normal}'`) === '1');
check('employee/admin manual confirm remains allowed', (await http(`/api/admin/payments/${pay.data.payment.id}/confirm`, {}, 'admin')).status === 200);
const after = await track(normal, '00012101'); check('confirmed receipt', after.data.order.status === 'confirmado' && !!after.data.order.receipt_token);
check('customer materialized after confirmation', sql("SELECT count(*) FROM customers WHERE phone='00012101'") === '1');
check('stock consumed only after confirmation', sql(`SELECT current_stock FROM inventory_items WHERE id='${item}'`) === '19.000');
await toggle('qr_2', true);
const rejected = await order('00012102'); const payment = await http(`/api/orders/${rejected}/payment`, { customer_phone: '00012102', qr_slot: 'qr_1' });
check('report QR1', payment.status === 200 && payment.data.payment.qr_slot === 'qr_1');
check('manual rejection', (await http(`/api/admin/payments/${payment.data.payment.id}/reject`, { reason: 'TEST TWO QR HTTP REJECTION' }, 'admin')).status === 200);
fs.writeFileSync(path.join(privateDir, 'browser-fixture.private.json'), JSON.stringify({ product, normal, rejected, item, phone: '00012102' }));
console.log(JSON.stringify({ passed: report.checks.filter(check => check.pass).length, failed: report.checks.filter(check => !check.pass).length, created: report.created.length, results: output }));
