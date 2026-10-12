// Directed functional regression. Existing disposable ROUND 3 fixtures only.
// Credentials and results are supplied outside Git; no load/concurrency tests.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServerClient } from '@supabase/ssr';
const [privateDir, lab, app, output] = process.argv.slice(2);
const local = value => { const url = new URL(value); return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname); };
if (!privateDir || !lab || !app || !output || !local(app)) throw Error('Provide private fixture directory, unlinked local lab, localhost app and private output.');
const cfg = JSON.parse(fs.readFileSync(path.join(privateDir, 'status.private.json'), 'utf8').replace(/^\uFEFF/, ''));
if (!local(cfg.API_URL) || cfg.API_URL !== 'http://127.0.0.1:57621' || fs.existsSync(path.join(lab, 'supabase/.temp/project-ref'))) throw Error('LOCAL guard: forbidden destination');
if (path.resolve(output).startsWith(path.resolve(process.cwd()) + path.sep)) throw Error('Results must remain outside the repository.');
const fixture = JSON.parse(fs.readFileSync(path.join(privateDir, 'results.private.json'), 'utf8'));
const report = { app, supabase: cfg.API_URL, checks: [], created: [], requests: [], started: new Date().toISOString() };
const q = value => "'" + String(value).replaceAll("'", "''") + "'";
const sql = text => {
  if (!local(cfg.API_URL)) throw Error('SQL local guard');
  return execFileSync('docker', ['exec', 'supabase_db_NOVA-LOCAL-ROUND2-REPLAY', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At', '-c', text], { encoding: 'utf8', timeout: 60000, maxBuffer: 30e6 }).trim();
};
const json = text => JSON.parse(sql(text));
const check = (name, passed, evidence) => { report.checks.push({ name, passed, evidence }); fs.writeFileSync(output, JSON.stringify(report, null, 2)); if (!passed) throw Error('Directed regression failed: ' + name); };
const cookies = {};
for (const role of ['admin', 'employee']) {
  const credential = JSON.parse(fs.readFileSync(path.join(privateDir, role + '.credentials.private.json'), 'utf8'));
  const jar = new Map();
  const client = createServerClient(cfg.API_URL, cfg.ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: items => items.forEach(item => jar.set(item.name, item.value)) } });
  const response = await client.auth.signInWithPassword(credential);
  if (response.error) throw Error('Local synthetic login failed');
  cookies[role] = [...jar].map(([name, value]) => name + '=' + value).join('; ');
}
async function api(route, body, role = 'admin', method = body === undefined ? 'GET' : 'POST', raw = false) {
  if (!local(app)) throw Error('HTTP local guard');
  const response = await fetch(app + route, { method, redirect: 'manual', signal: AbortSignal.timeout(60000), headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.18.250.${crypto.randomInt(1, 254)}`, ...(cookies[role] ? { cookie: cookies[role] } : {}) }, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
  const bytes = Buffer.from(await response.arrayBuffer()); let data;
  try { data = JSON.parse(bytes.toString()); } catch { /* PDF */ }
  report.requests.push({ route, status: response.status });
  return { status: response.status, data, pdf: bytes.subarray(0, 5).toString() === '%PDF-', bytes: bytes.length };
}
const snapshot = () => json(`SELECT json_build_object('orders',(SELECT count(*) FROM orders),'payments',(SELECT count(*) FROM payments),'movements',(SELECT count(*) FROM inventory_movements),'entries',(SELECT count(*) FROM inventory_entries))`);
report.before = snapshot();
const all = []; const first = await api('/api/admin/orders?status=todos&limit=100');
check('orders over 1000 / metadata', first.status === 200 && first.data.pagination.total > 1000 && first.data.orders.length === 100, first.data.pagination);
all.push(...first.data.orders);
for (let page = 2; page <= first.data.pagination.total_pages; page++) { const result = await api(`/api/admin/orders?status=todos&limit=100&page=${page}`); check('orders page ' + page, result.status === 200, { status: result.status }); all.push(...result.data.orders); }
check('all order pages, no duplicates', all.length === first.data.pagination.total && new Set(all.map(order => order.id)).size === all.length, { rows: all.length });
const old = await api('/api/admin/orders?status=todos&search=1104'); check('old order 1104 found', old.status === 200 && old.data.orders.some(order => order.order_number === 1104), { numbers: old.data.orders.map(order => order.order_number) });
for (const status of ['activos', 'pendiente_pago', 'confirmado', 'en_preparacion', 'listo', 'finalizado', 'cancelado', 'expirados', 'rechazado']) {
  const result = await api('/api/admin/orders?status=' + status);
  const where = status === 'activos' ? "status IN ('pendiente_pago','confirmado','en_preparacion','listo')" : status === 'expirados' ? "status='cancelado' AND cancellation_reason='Reserva de inventario vencida.'" : 'status=' + q(status);
  const expected = Number(sql('SELECT count(*) FROM orders WHERE deleted_at IS NULL AND ' + where));
  check('server status filter ' + status, result.status === 200 && result.data.pagination.total === expected, { status: result.status, expected, actual: result.data?.pagination });
}
for (const type of ['online', 'fisica']) { const result = await api('/api/admin/orders?type=' + type); check('server type ' + type, result.data.pagination.total === Number(sql('SELECT count(*) FROM orders WHERE deleted_at IS NULL AND order_type=' + q(type))), result.data.pagination); }
const pending = await api('/api/admin/orders?pending_payment=true'); check('server pending payment', pending.data.pagination.total === Number(sql("SELECT count(*) FROM orders o WHERE deleted_at IS NULL AND EXISTS(SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='pendiente')")), pending.data.pagination);
const outside = await api('/api/admin/orders?page=9999'); check('outside page is empty with metadata', outside.status === 200 && outside.data.orders.length === 0, { status: outside.status, pagination: outside.data.pagination });
const active = "status IN ('confirmado','en_preparacion','listo','finalizado')";
const expectedSales = json(`SELECT json_build_object('count',count(*),'total',coalesce(sum(total),0),'online',count(*)FILTER(WHERE order_type='online'),'fisica',count(*)FILTER(WHERE order_type='fisica')) FROM orders WHERE ${active} AND created_at>='2026-01-01T00:00:00-04:00' AND created_at<='2027-12-31T23:59:59.999999-04:00'`);
const sales = await api('/api/admin/reports/sales?from=2026-01-01&to=2027-12-31&format=json');
check('sales complete SQL reconciliation', sales.status === 200 && sales.data.orders.length === expectedSales.count && sales.data.summary.total_sales === expectedSales.total && sales.data.summary.count_online === expectedSales.online && sales.data.summary.count_fisica === expectedSales.fisica, { expected: expectedSales, summary: sales.data?.summary, rows: sales.data?.orders.length });
const sold = await api('/api/admin/reports/products-sold?from=2026-01-01&to=2027-12-31&format=json');
const expectedProducts = json(`SELECT coalesce(json_agg(x ORDER BY product_name),'[]') FROM(SELECT product_name_snapshot product_name,sum(quantity)quantity,sum(line_total)revenue FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.${active} AND o.created_at>='2026-01-01T00:00:00-04:00' AND o.created_at<='2027-12-31T23:59:59.999999-04:00' GROUP BY product_name_snapshot)x`);
check('products sold full SQL quantities/revenue', sold.status === 200 && expectedProducts.every(expected => sold.data.products.some(actual => actual.product_name === expected.product_name && actual.quantity === expected.quantity && actual.revenue === expected.revenue)) && sold.data.products.length === expectedProducts.length, { status: sold.status, expected: expectedProducts, actual: sold.data?.products });
for (const type of ['sales', 'products-sold']) { const result = await api(`/api/admin/reports/${type}?from=2026-01-01&to=2027-12-31&format=pdf`); check(type + ' real PDF', result.status === 200 && result.pdf, { status: result.status, bytes: result.bytes }); }
const dash = await api('/api/admin/dashboard');
const expectedTop = json(`SELECT coalesce(json_agg(x),'[]')FROM(SELECT product_name_snapshot name,sum(quantity)quantity FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.${active} AND o.created_at>=now()-interval '30 days' GROUP BY product_name_snapshot ORDER BY sum(quantity) DESC LIMIT 5)x`);
const todaySales = Number(sql(`SELECT coalesce(sum(total),0) FROM orders WHERE ${active} AND created_at>=date_trunc('day',now() AT TIME ZONE 'America/La_Paz') AT TIME ZONE 'America/La_Paz'`));
check('dashboard full SQL top5 / sales', dash.status === 200 && dash.data.dashboard.ventas_hoy === todaySales && expectedTop.every(row => dash.data.dashboard.productos_mas_vendidos.some(actual => actual.name === row.name && actual.quantity === row.quantity)), { status: dash.status, expectedTop, actual: dash.data?.dashboard });
const product = fixture.products[199]; const previousPrice = Number(sql('SELECT price FROM products WHERE id=' + q(product.id)));
const unchanged = snapshot();
for (const body of ['', '{', '{"price":NaN}', '{"price":Infinity}', 'null', '[]']) { const result = await api('/api/admin/products/' + product.id, body, 'admin', 'PATCH', true); check('product invalid JSON ' + body, result.status === 400, { status: result.status, response: result.data }); }
for (const price of [0.001, 10000000000, 1e20]) { const result = await api('/api/admin/products/' + product.id, { price }, 'admin', 'PATCH'); check('price rejects ' + price, result.status === 400 && Number(sql('SELECT price FROM products WHERE id=' + q(product.id))) === previousPrice, { status: result.status }); }
for (const price of [0.01, 9999999999.99]) { const result = await api('/api/admin/products/' + product.id, { price }, 'admin', 'PATCH'); check('price valid ' + price, result.status === 200 && Number(sql('SELECT price FROM products WHERE id=' + q(product.id))) === price, { status: result.status }); }
await api('/api/admin/products/' + product.id, { price: previousPrice }, 'admin', 'PATCH');
for (const [route, method] of [['/api/products/bad','GET'],['/api/admin/orders/bad','GET'],['/api/admin/payments/bad/confirm','POST'],['/api/admin/payments/bad/reject','POST'],['/api/admin/orders/bad/cancel','POST'],['/api/admin/customers/bad','PATCH'],['/api/admin/inventory/items/bad','PATCH']]) { const result = await api(route, method === 'GET' ? undefined : { reason:'TEST directed' }, 'admin', method); check('invalid UUID ' + route, result.status === 400, { status: result.status }); }
const itemId = sql('SELECT id FROM inventory_items ORDER BY id LIMIT 1');
for (const received_at of ['bad-date','999999999-01-01','2026-02-30']) { const result = await api('/api/admin/inventory/entries', { inventory_item_id:itemId, quantity:1, received_at }); check('invalid received date ' + received_at, result.status === 400, { status:result.status }); }
const makeOrder = (quantity=1, promotion_id=null) => ({ customer_name:'TEST ROUND3 FIX', customer_phone:'00073003', items:[{product_id:fixture.products[20].id,quantity}], promotion_id, idempotency_key:'TEST-R3-FIX-'+crypto.randomUUID() });
const huge = await api('/api/orders', makeOrder(1000000000), 'anon'); check('quantity 1e9 rejected', huge.status === 400, {status:huge.status});
const excessive = makeOrder(Number(sql('SELECT current_stock FROM inventory_items WHERE id=(SELECT inventory_item_id FROM product_inventory_requirements WHERE product_id='+q(fixture.products[20].id)+' LIMIT 1)'))+1);
const stockRejection = await api('/api/orders', excessive, 'anon'); check('above stock controlled rejection', stockRejection.status===400,{status:stockRejection.status});
check('invalid input no business mutation', JSON.stringify(snapshot()) === JSON.stringify(unchanged), {before:unchanged,after:snapshot()});
async function create(body) { const result=await api('/api/orders',body,'anon');check('directed order created',result.status===201,{status:result.status});report.created.push({kind:'online',id:result.data.order_id,phone:body.customer_phone});return result.data.order_id; }
for(const quantity of [0.001,0.5]) {
  const body=makeOrder(quantity);body.items[0].product_id=fixture.products[17].id;
  const decimalId=await create(body);check('decimal quantity persisted '+quantity,Number(sql('SELECT quantity FROM order_items WHERE order_id='+q(decimalId)))===quantity,{id:decimalId,quantity});
  const cancellation=await api('/api/admin/orders/'+decimalId+'/cancel',{reason:'TEST ROUND3 FIX decimal regression complete'});check('decimal reservation cancelled',cancellation.status===200,{status:cancellation.status});
}
const validDate='2026-10-12T08:30:00-04:00';
const entry=await api('/api/admin/inventory/entries',{inventory_item_id:itemId,quantity:0.001,received_at:validDate,notes:'TEST ROUND3 FIX ISO date'});
check('valid ISO date accepted',entry.status===201,{status:entry.status});report.created.push({kind:'inventory-entry',id:entry.data.entry.id});
const normalId=await create(makeOrder());
const reservation=Number(sql("SELECT count(*) FROM inventory_reservations WHERE order_id="+q(normalId)+" AND status='reserved'"));check('normal order reserves',reservation>0,{reservation});
const payment=await api('/api/orders/'+normalId+'/payment',{customer_phone:'00073003'},'anon');check('report payment',payment.status===200,{status:payment.status});
const confirmed=await api('/api/admin/payments/'+payment.data.payment.id+'/confirm',{});check('confirm payment',confirmed.status===200,{status:confirmed.status});
const number=Number(sql('SELECT order_number FROM orders WHERE id='+q(normalId)));
const tracked=await api('/api/orders/track',{order_number:number,customer_phone:'00073003'},'anon');check('tracking after confirmation',tracked.status===200&&tracked.data.order.status==='confirmado'&&!!tracked.data.order.receipt_token,{status:tracked.status});
const receipt=await api('/api/orders/receipt/'+tracked.data.order.receipt_token,undefined,'anon');check('receipt PDF',receipt.status===200&&receipt.pdf,{status:receipt.status});
const freeId=await create(makeOrder(1,fixture.promos[0]));check('legitimate free order',Number(sql('SELECT total FROM orders WHERE id='+q(freeId)))===0&&sql('SELECT status FROM orders WHERE id='+q(freeId))==='confirmado'&&Number(sql('SELECT count(*)FROM payments WHERE order_id='+q(freeId)))===0,{id:freeId});
const expiredId=await create(makeOrder());sql("UPDATE orders SET created_at=now()-interval '31 minutes',reserved_until=now()-interval '1 minute' WHERE id="+q(expiredId));sql("UPDATE inventory_reservations SET expires_at=now()-interval '1 minute' WHERE order_id="+q(expiredId));sql('SELECT release_expired_reservations(NULL::uuid)');check('expiration releases test order',sql('SELECT status FROM orders WHERE id='+q(expiredId))==='cancelado'&&Number(sql("SELECT count(*)FROM inventory_reservations WHERE status='reserved' AND order_id="+q(expiredId)))===0,{id:expiredId});
const physical=await api('/api/admin/sales',{items:[{product_id:fixture.products[20].id,quantity:1}],payment_method:'efectivo'},'employee');check('physical sale and cash',physical.status===201,{status:physical.status});report.created.push({kind:'physical',id:physical.data.sale.id});
check('physical cash single movement',Number(sql("SELECT count(*)FROM cash_movements WHERE order_id="+q(physical.data.sale.id)+" AND movement_type='venta'"))===1,{});
report.after=snapshot();report.completed=new Date().toISOString();fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(row=>row.passed).length,created:report.created,output},null,2));
