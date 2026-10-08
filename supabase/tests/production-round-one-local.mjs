// HTTP/Auth/SQL reales. Rechaza cualquier destino que no sea el laboratorio local.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const lab = process.env.NOVA_LOCAL_LAB;
if (!lab || path.basename(lab) !== 'NOVA-LOCAL-VALIDATION' || fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))) throw Error('Laboratorio no vinculado requerido');
const config=JSON.parse(fs.readFileSync(path.join(lab,'.env-local-status.private.json'),'utf8').replace(/^\uFEFF/,''));
const http=process.env.NOVA_LOCAL_HTTP || 'http://127.0.0.1:3110';
if(config.API_URL!=='http://127.0.0.1:55421' || !/^http:\/\/127\.0\.0\.1:\d+$/.test(http)) throw Error('Solo localhost');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {createClient}=require('@supabase/supabase-js'); const {createServerClient}=require('@supabase/ssr');
const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const label='TEST ROUND ONE '+crypto.randomUUID().slice(0,8); let cookie=''; const cases=[]; const fixtures=[]; const errors=[];
const testIp=`198.18.${crypto.randomInt(1,254)}.${crypto.randomInt(1,254)}`;
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
async function sql(statement) {const {stdout}=await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',statement]);return stdout.trim();}
function check(name,condition) {cases.push({name,passed:!!condition});console.log(name,condition?'PASS':'FAIL');if(!condition)throw Error(name);}
async function api(route,body,admin=false,method=body?'POST':'GET') {const response=await fetch(http+route,{method,redirect:'manual',headers:{'Content-Type':'application/json','x-forwarded-for':testIp,...(admin?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={redirect:response.headers.get('location')};}return {status:response.status,data};}
async function create(name,extra={}) {const result=await api('/api/orders',{customer_name:label,customer_phone:'70000189',items:[{product_id:product,quantity:1}],idempotency_key:label+'-'+name,...extra});check('create '+name,result.status===201);fixtures.push({table:'orders',id:result.data.order_id});return result.data.order_id;}
let product;let actor;let item;
try {
  const email=label.replaceAll(' ','-').toLowerCase()+'@example.invalid';const password=crypto.randomBytes(24).toString('hex');
  const created=await service.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;actor=created.data.user.id;
  fixtures.push({table:'auth.users',id:actor});await sql(`UPDATE profiles SET role='administrador',is_active=true,full_name=${q(label)} WHERE id=${q(actor)}`);
  const jar=new Map();const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(i=>jar.set(i.name,i.value))}});
  const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;cookie=[...jar].map(([name,value])=>name+'='+value).join('; ');
  await api('/api/admin/system-settings/accept-orders-outside-hours',{enabled:true},true,'PATCH');
  const productResult=await api('/api/admin/products',{name:label,price:10},true);product=productResult.data.product.id;
  const inv=await api('/api/admin/inventory/items',{name:label,item_type:'flor'},true);item=inv.data.item.id;
  fixtures.push({table:'products',id:product},{table:'inventory_items',id:item});
  check('recipe',(await api(`/api/admin/products/${product}/inventory-requirements`,{inventory_item_id:item,quantity:1},true)).status===201);
  check('entry',(await api('/api/admin/inventory/entries',{inventory_item_id:item,quantity:20},true)).status===201);
  const rejected=await api('/api/orders',{customer_name:label,customer_phone:'1234567',items:[{product_id:product,quantity:1}],idempotency_key:label+'bad'});check('HTTP phone 7 rejected',rejected.status===400);
  const order=await create('paid');check('normal creation sends no notification',await sql(`SELECT count(*) FROM notifications WHERE reference_id=${q(order)}`)==='0');
  check('wrong phone blocked',(await api(`/api/orders/${order}/payment`,{customer_phone:'70000188'})).status===404);
  const reports=await Promise.all([api(`/api/orders/${order}/payment`,{customer_phone:'70000189'}),api(`/api/orders/${order}/payment`,{customer_phone:'70000189'})]);
  check('concurrent reports same payment',reports.every(r=>r.status===200)&&reports[0].data.payment.id===reports[1].data.payment.id);
  const payment=reports[0].data.payment.id;
  check('one payment / one notification',await sql(`SELECT (SELECT count(*) FROM payments WHERE order_id=${q(order)})=1 AND (SELECT count(*) FROM notifications WHERE reference_id=${q(payment)})=1`)==='t');
  check('reported payment holds stock without consuming',await sql(`SELECT o.reserved_until IS NULL AND i.current_stock=20 AND (SELECT bool_and(status='reserved' AND expires_at='infinity'::timestamptz) FROM inventory_reservations WHERE order_id=o.id) FROM orders o,inventory_items i WHERE o.id=${q(order)} AND i.id=${q(item)}`)==='t');
  await sql(`SELECT public.release_expired_reservations(NULL)`);check('reported order survives expiration',await sql(`SELECT status FROM orders WHERE id=${q(order)}`)==='pendiente_pago');
  const [confirms] = await Promise.all([Promise.all([api(`/api/admin/payments/${payment}/confirm`,{},true),api(`/api/admin/payments/${payment}/confirm`,{},true)]),sql('SELECT public.release_expired_reservations(NULL)')]);check('concurrent confirmation and expiration one confirmation winner',confirms.filter(r=>r.status===200).length===1&&confirms.filter(r=>r.status===400).length===1);
  check('confirm consumes once',await sql(`SELECT current_stock FROM inventory_items WHERE id=${q(item)}`)==='19.000');
  check('tracking',(await api('/api/orders/track',{order_id:order,customer_phone:'70000189'})).data.order.status==='confirmado');
  const abandoned=await create('abandoned');await sql(`UPDATE orders SET reserved_until=clock_timestamp()-interval '31 minutes' WHERE id=${q(abandoned)};UPDATE inventory_reservations SET expires_at=clock_timestamp()-interval '31 minutes' WHERE order_id=${q(abandoned)};SELECT public.release_expired_reservations(NULL)`);
  check('abandoned expires / fully released / no payment or cash',await sql(`SELECT status='cancelado' AND (SELECT bool_and(status='released') FROM inventory_reservations WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM payments WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM cash_movements WHERE order_id=orders.id) FROM orders WHERE id=${q(abandoned)}`)==='t');
  check('expired payment rejected',(await api(`/api/orders/${abandoned}/payment`,{customer_phone:'70000189'})).status===400);
  const bare=(await api('/api/admin/products',{name:label+' no recipe',price:10},true)).data.product.id;
  const noRecipe=await create('no-recipe',{items:[{product_id:bare,quantity:1}]});await sql(`UPDATE orders SET reserved_until=clock_timestamp()-interval '31 minutes' WHERE id=${q(noRecipe)};SELECT public.release_expired_reservations(NULL)`);check('no-recipe order expires',await sql(`SELECT status FROM orders WHERE id=${q(noRecipe)}`)==='cancelado');
  const promo=(await api('/api/admin/promotions',{name:label,promotion_type:'producto',discount_type:'porcentaje',discount_value:100},true)).data.promotion.id;
  await api(`/api/admin/promotions/${promo}/products`,{product_id:product},true);const free=await create('free',{promotion_id:promo});
  check('free checkout confirmed / no payment or cash / discount retained',await sql(`SELECT status='confirmado' AND total=0 AND discount_total=subtotal AND EXISTS(SELECT 1 FROM order_discounts WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM payments WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM cash_movements WHERE order_id=orders.id) FROM orders WHERE id=${q(free)}`)==='t');
  const identical={customer_name:label,customer_phone:'70000189',items:[{product_id:product,quantity:1}],idempotency_key:label+'-concurrent'};
  const submits=await Promise.all([api('/api/orders',identical),api('/api/orders',identical)]);
  check('concurrent idempotent order one id',submits.every(r=>r.status===201)&&submits[0].data.order_id===submits[1].data.order_id);
  const rejectedOrder=await create('rejected');const rejectedPayment=await api(`/api/orders/${rejectedOrder}/payment`,{customer_phone:'70000189'});
  check('report for rejection',rejectedPayment.status===200);
  check('admin rejects reported payment',(await api(`/api/admin/payments/${rejectedPayment.data.payment.id}/reject`,{reason:label},true)).status===200);
  check('rejection releases held reservations',await sql(`SELECT bool_and(status='released') FROM inventory_reservations WHERE order_id=${q(rejectedOrder)}`)==='t');
  const location={branch_name:label,address:'Dirección de prueba local',reference:'Solo laboratorio',maps_url:'',latitude:-17.7,longitude:-63.1,directions:'Referencia de prueba'};
  check('anon location denied',[307,403].includes((await api('/api/admin/store-location',location,false,'PATCH')).status));check('invalid Maps rejected',(await api('/api/admin/store-location',{...location,maps_url:'https://evil.example'},true,'PATCH')).status===400);
  check('location saved',(await api('/api/admin/store-location',location,true,'PATCH')).status===200);check('location public',(await api('/api/store-location')).data.location.address===location.address);
  const audit=await api('/api/admin/audit-log?table=system_settings',null,true);check('audit resolves name / preserves JSON',audit.status===200 && audit.data.entries.some(e=>e.after?.key==='store_location'&&e.user_name===label));
  check('audit table filter applies to every returned record',audit.data.entries.every(e=>e.table_name==='system_settings'));
  const paymentAudit=await api('/api/admin/audit-log?table=payments&action=pago_confirmado&user_id='+actor,null,true);
  check('audit actor and action filters / payment human details',paymentAudit.status===200 && paymentAudit.data.entries.length>0 && paymentAudit.data.entries.every(e=>e.user_id===actor && e.action==='pago_confirmado' && e.entity_name?.startsWith('Pedido #') && Number(e.presentation_details.amount)===10));
  check('cron configured',await sql("SELECT count(*) FROM cron.job WHERE jobname='anabelle-expire-unreported-orders' AND active") === '1');
  check('server-only payment ACL',await sql("SELECT NOT has_function_privilege('anon','public.create_payment(uuid,text)','EXECUTE') AND NOT has_function_privilege('authenticated','public.create_payment(uuid,text)','EXECUTE') AND has_function_privilege('service_role','public.create_payment(uuid,text)','EXECUTE')") === 't');
} catch(error){errors.push(error.message);console.error('FAIL',error.message);process.exitCode=1;}
finally {fs.mkdirSync(path.join(lab,'certification'),{recursive:true});fs.writeFileSync(path.join(lab,'certification/PRODUCTION_ROUND_ONE.private.json'),JSON.stringify({label,cases,fixtures,errors,rollback:'Reconstruir solo NOVA-LOCAL-VALIDATION con db reset --local.'},null,2));console.log('SUMMARY',JSON.stringify({cases:cases.length,passed:cases.filter(c=>c.passed).length,errors}));}
