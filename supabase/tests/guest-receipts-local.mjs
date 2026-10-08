// Real HTTP/Auth/PostgreSQL regressions. No remote URLs, no stored credentials.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile), lab=process.env.NOVA_LOCAL_LAB;
if(!lab || path.basename(lab)!=='NOVA-LOCAL-VALIDATION' || fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))) throw Error('Unlinked local lab required');
const config=JSON.parse(fs.readFileSync(path.join(lab,'.env-local-status.private.json'),'utf8').replace(/^\uFEFF/,''));
const http=process.env.NOVA_LOCAL_HTTP || 'http://127.0.0.1:3110';
if(config.API_URL!=='http://127.0.0.1:55421'||!/^http:\/\/127\.0\.0\.1:\d+$/.test(http))throw Error('Localhost only');
const require=createRequire(new URL('../../package.json',import.meta.url));
const {createClient}=require('@supabase/supabase-js'),{createServerClient}=require('@supabase/ssr');
const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const anon=createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false}});
const label='TEST GUEST RECEIPTS '+crypto.randomUUID().slice(0,8), cases=[], fixtures=[], errors=[];
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const sql=async statement=>(await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',statement])).stdout.trim();
function check(name,condition){cases.push({name,passed:!!condition});console.log(name,condition?'PASS':'FAIL');if(!condition)throw Error(name);}
let cookie='',product,item;
async function api(route,body,admin=false,method=body?'POST':'GET'){
 const response=await fetch(http+route,{method,headers:{'Content-Type':'application/json','x-forwarded-for':`198.18.${crypto.randomInt(1,254)}.${crypto.randomInt(1,254)}`,...(admin?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
 if(response.headers.get('content-type')?.includes('application/pdf'))return {status:response.status,pdf:Buffer.from(await response.arrayBuffer()),headers:response.headers};
 const data=await response.json().catch(()=>null);return {status:response.status,data};
}
const phone=()=>String(70000000+crypto.randomInt(0,9999999));
async function order(name,p=phone(),extra={}){
 const body={customer_name:label,customer_phone:p,customer_message:'Método: Entrega por coordinar\nDirección sintética\nReferencia: Solo laboratorio',items:[{product_id:product,quantity:1}],idempotency_key:label+'-'+name,...extra};
 const result=await api('/api/orders',body);check('create '+name,result.status===201);
 const id=result.data.order_id;fixtures.push({table:'orders',id,phone:p});return {id,phone:p,body};
}
const customerCount=p=>sql(`SELECT count(*) FROM customers WHERE phone=${q(p)}`);
const report=o=>api(`/api/orders/${o.id}/payment`,{customer_phone:o.phone});
try{
 const credentials=JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/local-test/admin-pruebas.credentials.private.json'),'utf8'));
 if(credentials.supabase_url!==config.API_URL)throw Error('Test credentials target mismatch');
 const jar=new Map(), admin=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
 const login=await admin.auth.signInWithPassword({email:credentials.email,password:credentials.password});if(login.error)throw login.error;cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
 check('real admin login',!!login.data.session);
 check('local admin profile',await sql(`SELECT role='administrador' AND is_active FROM profiles WHERE id=${q(login.data.user.id)}`)==='t');
 const normalClient=createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false}});
 const testEmail=`tracking-${crypto.randomUUID()}@example.invalid`, testPassword=crypto.randomBytes(24).toString('base64url');
 const testUser=await service.auth.admin.createUser({email:testEmail,password:testPassword,email_confirm:true,user_metadata:{full_name:label}});
 if(testUser.error)throw testUser.error;fixtures.push({table:'auth.users',id:testUser.data.user.id});
 const normalLogin=await normalClient.auth.signInWithPassword({email:testEmail,password:testPassword}); if(normalLogin.error)throw normalLogin.error;
 check('authenticated tracking tester is not admin',await sql(`SELECT role <> 'administrador' FROM profiles WHERE id=${q(testUser.data.user.id)}`)==='t');
 await api('/api/admin/system-settings/accept-orders-outside-hours',{enabled:true},true,'PATCH');
 const result=await api('/api/admin/products',{name:label,price:10},true);product=result.data.product.id;
 item=(await api('/api/admin/inventory/items',{name:label,item_type:'flor'},true)).data.item.id;
 fixtures.push({table:'products',id:product},{table:'inventory_items',id:item});
 check('recipe',(await api(`/api/admin/products/${product}/inventory-requirements`,{inventory_item_id:item,quantity:1},true)).status===201);
 check('inventory entry',(await api('/api/admin/inventory/entries',{inventory_item_id:item,quantity:25},true)).status===201);
 const normal=await order('normal');
 check('new temporary order creates no customer',await customerCount(normal.phone)==='0');
 check('guest snapshot and null customer FK',await sql(`SELECT customer_id IS NULL AND guest_name=${q(label)} AND guest_phone=${q(normal.phone)} FROM orders WHERE id=${q(normal.id)}`)==='t');
 check('guest tracking works before report',(await api('/api/orders/track',{order_id:normal.id,customer_phone:normal.phone})).data.order.payment_status===null);
 const trackingArgs={p_order_id:normal.id,p_order_number:null,p_customer_phone:normal.phone};
 const number=Number(await sql(`SELECT order_number FROM orders WHERE id=${q(normal.id)}`));
 for(const [fn,args] of [['track_order_details',trackingArgs],['track_order',{p_order_number:number,p_customer_phone:normal.phone}]]){
  check('anon cannot invoke '+fn,!!(await anon.rpc(fn,args)).error);
  check('normal authenticated cannot invoke '+fn,!!(await normalClient.rpc(fn,args)).error);
  check('service role can invoke '+fn,!(await service.rpc(fn,args)).error);
 }
 const wrongTrack=await api('/api/orders/track',{order_id:normal.id,customer_phone:'00000000'});
 check('wrong tracking phone gets no order/token',wrongTrack.status===404&&!wrongTrack.data?.order);
 const rateIp=`198.19.${crypto.randomInt(1,254)}.${crypto.randomInt(1,254)}`, rateStatuses=[];
 for(let i=0;i<21;i++){const response=await fetch(http+'/api/orders/track',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':rateIp},body:JSON.stringify({order_id:normal.id,customer_phone:normal.phone})});rateStatuses.push(response.status);}
 check('real tracking rate limit accepts 20 then blocks 21',rateStatuses.slice(0,20).every(status=>status===200)&&rateStatuses[20]===429);
 check('tracking SQL ACL closes PUBLIC/anon/authenticated on both signatures',await sql("SELECT bool_and(NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE') AND has_function_privilege('service_role',p.oid,'EXECUTE') AND NOT EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('track_order','track_order_details')")==='t');
 check('no public definer RPC discloses receipt token',await sql("SELECT count(*)=0 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef AND p.prosrc ILIKE '%receipt_token%' AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))")==='t');
 const token=await sql(`SELECT receipt_token FROM orders WHERE id=${q(normal.id)}`);
 check('public receipt unavailable before confirmation',(await api('/api/orders/receipt/'+token)).status===404);
 check('admin receipt unavailable before confirmation',(await api(`/api/admin/orders/${normal.id}/receipt`,null,true)).status===409);
 check('wrong phone cannot report',(await api(`/api/orders/${normal.id}/payment`,{customer_phone:phone()})).status===404);
 const reports=await Promise.all([report(normal),report(normal)]);
 check('double report reuses one payment',reports.every(r=>r.status===200)&&reports[0].data.payment.id===reports[1].data.payment.id);
 check('report creates no customer',await customerCount(normal.phone)==='0');
 check('pending receipt token not disclosed',(await api('/api/orders/track',{order_id:normal.id,customer_phone:normal.phone})).data.order.receipt_token===null);
 check('reported reservation held / stock not consumed',await sql(`SELECT o.reserved_until IS NULL AND i.current_stock=25 AND (SELECT bool_and(status='reserved' AND expires_at='infinity') FROM inventory_reservations WHERE order_id=o.id) FROM orders o,inventory_items i WHERE o.id=${q(normal.id)} AND i.id=${q(item)}`)==='t');
 await sql('SELECT release_expired_reservations(NULL)');
 check('expiration leaves reported order pending',await sql(`SELECT status FROM orders WHERE id=${q(normal.id)}`)==='pendiente_pago');
 const payment=reports[0].data.payment.id;
 const confirms=await Promise.all([api(`/api/admin/payments/${payment}/confirm`,{},true),api(`/api/admin/payments/${payment}/confirm`,{},true),sql('SELECT release_expired_reservations(NULL)')]);
 check('concurrent confirm/expiry single winner',confirms.slice(0,2).filter(r=>r.status===200).length===1&&confirms.slice(0,2).filter(r=>r.status===400).length===1);
 check('confirmation materializes one customer',await customerCount(normal.phone)==='1');
 check('confirmed order links customer',await sql(`SELECT customer_id IS NOT NULL FROM orders WHERE id=${q(normal.id)}`)==='t');
 check('inventory consumed exactly once',await sql(`SELECT current_stock FROM inventory_items WHERE id=${q(item)}`)==='24.000');
 const tracking=await api('/api/orders/track',{order_id:normal.id,customer_phone:normal.phone});
 check('confirmed tracking discloses eligible token',tracking.data.order.receipt_token===token&&tracking.data.order.status==='confirmado');
 const pdf=await api('/api/orders/receipt/'+token);
 check('public confirmed PDF real bytes',pdf.status===200&&pdf.pdf?.subarray(0,5).toString()==='%PDF-');
 check('receipt has no cache / no referrer',pdf.headers?.get('cache-control')==='private, no-store'&&pdf.headers?.get('referrer-policy')==='no-referrer');
 check('admin confirmed PDF',(await api(`/api/admin/orders/${normal.id}/receipt`,null,true)).status===200);
 check('order UUID cannot enumerate receipt',(await api('/api/orders/receipt/'+normal.id)).status===404);
 check('sequential number cannot enumerate receipt',(await api('/api/orders/receipt/'+tracking.data.order.order_number)).status===404);
 check('unknown token cannot access receipt',(await api('/api/orders/receipt/'+crypto.randomUUID())).status===404);
 for(const status of ['en_preparacion','listo','finalizado']){
  check('advance '+status,(await api(`/api/admin/orders/${normal.id}/status`,{new_status:status},true)).status===200);
  check('tracking '+status,(await api('/api/orders/track',{order_id:normal.id,customer_phone:normal.phone})).data.order.status===status);
 }
 const rejected=await order('rejected'), pending=await report(rejected);
 check('reject payment',(await api(`/api/admin/payments/${pending.data.payment.id}/reject`,{reason:label},true)).status===200);
 check('rejection creates no customer and preserves order',await customerCount(rejected.phone)==='0'&&await sql(`SELECT status='rechazado' FROM orders WHERE id=${q(rejected.id)}`)==='t');
 const abandoned=await order('timeout');
 await sql(`UPDATE orders SET reserved_until=clock_timestamp()-interval '31 minutes' WHERE id=${q(abandoned.id)}; UPDATE inventory_reservations SET expires_at=clock_timestamp()-interval '31 minutes' WHERE order_id=${q(abandoned.id)}; SELECT release_expired_reservations(NULL)`);
 check('timeout no customer',await customerCount(abandoned.phone)==='0');
 check('timeout preserves history and releases without cash/payments/consumption',await sql(`SELECT status='cancelado' AND (SELECT bool_and(status='released') FROM inventory_reservations WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM payments WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM cash_movements WHERE order_id=orders.id) FROM orders WHERE id=${q(abandoned.id)}`)==='t');
 const cancelled=await order('cancelled');check('cancel before report',(await api(`/api/admin/orders/${cancelled.id}/cancel`,{reason:label},true)).status===200);check('cancel no customer',await customerCount(cancelled.phone)==='0');
 const promo=(await api('/api/admin/promotions',{name:label,promotion_type:'producto',discount_type:'porcentaje',discount_value:100},true)).data.promotion.id;
 await api(`/api/admin/promotions/${promo}/products`,{product_id:product},true);fixtures.push({table:'promotions',id:promo});
 const free=await order('free',phone(),{promotion_id:promo});
 check('free confirmed creates one customer without payment/cash',await customerCount(free.phone)==='1'&&await sql(`SELECT status='confirmado' AND total=0 AND discount_total=subtotal AND customer_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM payments WHERE order_id=orders.id) AND NOT EXISTS(SELECT 1 FROM cash_movements WHERE order_id=orders.id) FROM orders WHERE id=${q(free.id)}`)==='t');
 check('free tracking has no paid receipt',(await api('/api/orders/track',{order_id:free.id,customer_phone:free.phone})).data.order.receipt_token===null);
 const retryPhone=phone(), body={customer_name:label,customer_phone:retryPhone,items:[{product_id:product,quantity:1}],idempotency_key:label+'-same-key'};
 const submits=await Promise.all([api('/api/orders',body),api('/api/orders',body)]);
 check('concurrent same idempotency key one order',submits.every(r=>r.status===201)&&submits[0].data.order_id===submits[1].data.order_id);
 check('retry does not create customer',await customerCount(retryPhone)==='0');fixtures.push({table:'orders',id:submits[0].data.order_id,phone:retryPhone});
 check('private receipt/materialization RPC ACL',await sql("SELECT NOT has_function_privilege('anon','get_public_order_receipt(uuid)','EXECUTE') AND NOT has_function_privilege('authenticated','get_public_order_receipt(uuid)','EXECUTE') AND has_function_privilege('service_role','get_public_order_receipt(uuid)','EXECUTE') AND NOT has_function_privilege('service_role','materialize_order_customer(uuid)','EXECUTE')")==='t');
 for(const [fn,args] of [['get_public_order_receipt',{p_token:token}],['materialize_order_customer',{p_order_id:normal.id}],['create_payment',{p_order_id:normal.id,p_customer_phone:normal.phone}],['apply_order_discount',{p_order_id:normal.id,p_subtotal:10,p_customer_id:null,p_promotion_id:null,p_manual_amount:10,p_manual_reason:label,p_actor_id:null}],['consume_product_inventory',{p_product_id:product,p_quantity_sold:1,p_reference_type:'test',p_reference_id:normal.id,p_created_by:null}]]){
  check('real anon RPC denied '+fn,!!(await anon.rpc(fn,args)).error);
  check('real authenticated RPC denied '+fn,!!(await admin.rpc(fn,args)).error);
 }
 check('anon cannot select orders/customers',(await anon.from('orders').select('id')).data?.length===0&&(await anon.from('customers').select('id')).data?.length===0);
 check('obsolete payment signature absent',await sql("SELECT to_regprocedure('public.create_payment(uuid)') IS NULL")==='t');
 const original=await sql(`SELECT guest_phone FROM orders WHERE id=${q(normal.id)}`);
 const mutated=await service.from('orders').update({guest_phone:phone()}).eq('id',normal.id);check('guest snapshot cannot be changed',!!mutated.error&&await sql(`SELECT guest_phone FROM orders WHERE id=${q(normal.id)}`)===original);
 check('cron active',await sql("SELECT count(*) FROM cron.job WHERE jobname='anabelle-expire-unreported-orders' AND active")==='1');
}catch(error){errors.push(error.message);console.error('FAIL',error.message);process.exitCode=1;}
finally{fs.mkdirSync(path.join(lab,'certification'),{recursive:true});fs.writeFileSync(path.join(lab,'certification/GUEST_RECEIPTS.private.json'),JSON.stringify({label,cases,fixtures,errors,rollback:'Fixtures retained for browser tests. No automatic deletion.'},null,2));console.log('SUMMARY',JSON.stringify({cases:cases.length,passed:cases.filter(c=>c.passed).length,errors}));}
