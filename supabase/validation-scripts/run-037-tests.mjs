import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile), root='C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION';
const require=createRequire(root+'/app/package.json');
const {createClient}=require('@supabase/supabase-js'), {createServerClient}=require('@supabase/ssr');
const config=JSON.parse(fs.readFileSync(root+'/.env-local-status.private.json','utf8').replace(/^\uFEFF/,''));
if(config.API_URL!=='http://127.0.0.1:55421')throw Error('Destino no local');
const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const anon=createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false}});
const report={http:[],jwt:[],concurrency:[],promotions:[],fixtures:[],errors:[]};
const save=()=>fs.writeFileSync(root+'/certification/RESULTS_037.json',JSON.stringify(report,null,2));
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
async function sql(s){const {stdout}=await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',s],{maxBuffer:8e6});return stdout.trim();}
async function json(s){return JSON.parse(await sql(s));}
function rec(section,name,passed,details){report[section].push({name,passed,details});save();console.log(section,name,passed?'PASS':'FAIL');}
const users={};
async function api(path,role='anon',body,method=body?'POST':'GET'){
 const r=await fetch('http://127.0.0.1:3100'+path,{method,headers:{'Content-Type':'application/json',...(users[role]?{Cookie:users[role].cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={html:text.slice(0,100)};}
 return {status:r.status,data};
}
async function expectApi(name,path,role,body,status,method){const r=await api(path,role,body,method);rec('http',name,r.status===status,r);return r;}
async function addUser(role,active){
 const email=`test-nova-${role}@example.invalid`,password=crypto.randomBytes(20).toString('hex');
 const {data,error}=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'TEST NOVA '+role}});if(error)throw error;
 const id=data.user.id;await sql(`UPDATE public.profiles SET role=${q(role==='admin'?'administrador':'empleado')},is_active=${active} WHERE id=${q(id)}`);
 const jar=new Map();const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(x=>jar.set(x.name,x.value))}});
 const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;
 users[role]={id,client,token:login.data.session.access_token,cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')};
 report.fixtures.push({type:'auth-user',id,email,active,role});rec('jwt','Auth password login '+role,true,{id,active});
}
async function product(label,stock){const item=crypto.randomUUID(),product=crypto.randomUUID();await sql(`INSERT INTO inventory_items(id,name,item_type) VALUES(${q(item)},${q('TEST NOVA '+label)},'flor'); INSERT INTO inventory_entries(inventory_item_id,quantity,created_by) VALUES(${q(item)},${stock},${q(users.admin.id)}); INSERT INTO products(id,name,price) VALUES(${q(product)},${q('TEST NOVA '+label)},100); INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity) VALUES(${q(product)},${q(item)},1)`);report.fixtures.push({type:'product-stock',product,item,stock});save();return {product,item};}
const orderArgs=(p,key,promo=null)=>({p_customer_name:'TEST NOVA CUSTOMER',p_customer_phone:'70000999',p_customer_whatsapp:null,p_items:[{product_id:p,quantity:1}],p_customer_message:null,p_idempotency_key:key,p_promotion_id:promo});
const callOrder=(p,key,promo=null)=>`public.create_order('TEST NOVA CUSTOMER','70000999',NULL,${q(JSON.stringify([{product_id:p,quantity:1}]))}::jsonb,NULL,${q(key)},${promo?q(promo):'NULL'})`;
const claims=`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub=${q('PLACEHOLDER')};`;
function authSql(body){return `BEGIN; SET LOCAL request.jwt.claim.sub=${q(users.admin.id)}; SET LOCAL request.jwt.claims=${q(JSON.stringify({sub:users.admin.id,role:'authenticated'}))}; SET LOCAL ROLE authenticated; ${body}; COMMIT;`;}
async function session(s,label){const start=Date.now();try{const {stdout}=await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',`SET application_name=${q(label)}; SELECT pg_backend_pid(); ${s}`],{maxBuffer:1e6});return {ok:true,ms:Date.now()-start,output:stdout.trim()};}catch(e){return {ok:false,ms:Date.now()-start,error:e.stderr||e.message};}}
async function pair(name,s1,s2,state,check){const p1=session(s1,'NOVA-A-'+name);await new Promise(r=>setTimeout(r,80));const p2=session(s2,'NOVA-B-'+name);await new Promise(r=>setTimeout(r,250));const waiting=await json(`SELECT coalesce(json_agg(json_build_object('pid',pid,'application',application_name,'wait_type',wait_event_type,'wait',wait_event,'blockers',pg_blocking_pids(pid))), '[]') FROM pg_stat_activity WHERE application_name LIKE 'NOVA-%'`);const sessions=await Promise.all([p1,p2]);const final=await json(state);rec('concurrency',name,check(sessions,final),{sessions,waiting,final});}
try{
 if(Number(await sql('SELECT count(*) FROM profiles'))!==0)throw Error('Lab no vacío; no sobrescribir fixtures desconocidos');
 for(const [role,active] of [['admin',true],['employee',true],['inactive',false]])await addUser(role,active);
 fs.writeFileSync(root+'/private/auth-sessions.json',JSON.stringify(users,(k,v)=>k==='client'?undefined:v));
 for(const [role,expected] of [['admin',200],['employee',403],['inactive',403],['anon',307]])await expectApi('users permission '+role,'/api/admin/users',role,null,expected);
 for(const [role,expected] of [['admin',200],['employee',200],['inactive',403]])await expectApi('inventory permission '+role,'/api/admin/inventory/items',role,null,expected);
 for(const role of ['employee','inactive']){
  for(const fn of ['get_audit_trail','consume_product_inventory','create_payment']){
   const args=fn==='get_audit_trail'?{p_limit:10,p_offset:0}:fn==='create_payment'?{p_order_id:crypto.randomUUID(),p_customer_phone:'70000999'}:{p_product_id:crypto.randomUUID(),p_quantity_sold:1,p_reference_type:'test',p_reference_id:null,p_created_by:users[role].id};
   const {error}=await users[role].client.rpc(fn,args);rec('jwt',role+' direct '+fn,!!error,{code:error?.code,message:error?.message});
  }
 }
 for(const path of ['/login','/checkout','/seguimiento','/api/products?limit=1','/api/business-hours','/api/promotions'])await expectApi('public '+path,path,'anon',null,200);
 await sql(`UPDATE system_settings SET value='{"enabled":true}' WHERE key='accept_orders_outside_hours'`);
 const itemReply=await expectApi('inventory create','/api/admin/inventory/items','employee',{name:'TEST NOVA HTTP INVENTORY',item_type:'flor'},201);
 const item=itemReply.data.item?.id;if(!item)throw Error('API inventory fixture failed');
 await expectApi('inventory entry','/api/admin/inventory/entries','employee',{inventory_item_id:item,quantity:50,unit_cost:1},201);
 const pr=await expectApi('product create','/api/admin/products','employee',{name:'TEST NOVA HTTP PRODUCT',price:100},201);const p=pr.data.product?.id;if(!p)throw Error('API product fixture failed');
 await expectApi('recipe create','/api/admin/products/'+p+'/inventory-requirements','employee',{inventory_item_id:item,quantity:1},201);
 const reg=await sql('SELECT id FROM cash_registers LIMIT 1');
 await expectApi('open cash','/api/admin/cash-sessions','employee',{cash_register_id:reg,opening_amount:0},201);
 async function httpOrder(key){const r=await expectApi('HTTP create order '+key,'/api/orders','anon',{customer_name:'TEST NOVA HTTP',customer_phone:'70000999',idempotency_key:key,items:[{product_id:p,quantity:1}]},201);return r.data.order_id;}
 const id=await httpOrder('TEST-NOVA-HTTP-A');
 await expectApi('HTTP wrong phone','/api/orders/'+id+'/payment','anon',{customer_phone:'70000111'},404);
 const pay=await expectApi('HTTP payment','/api/orders/'+id+'/payment','anon',{customer_phone:'70000999'},200);const payment=pay.data.payment.id;
 await expectApi('HTTP confirm','/api/admin/payments/'+payment+'/confirm','employee',{},200);
 for(const status of ['en_preparacion','listo','finalizado'])await expectApi('HTTP advance '+status,'/api/admin/orders/'+id+'/status','employee',{new_status:status},200);
 await expectApi('HTTP tracking','/api/orders/track','anon',{order_id:id,customer_phone:'70000999'},200);
 const rejectId=await httpOrder('TEST-NOVA-HTTP-B');const rp=await expectApi('HTTP payment for rejection','/api/orders/'+rejectId+'/payment','anon',{customer_phone:'70000999'},200);
 await expectApi('HTTP reject','/api/admin/payments/'+rp.data.payment.id+'/reject','admin',{reason:'TEST NOVA REJECTION'},200);
 await expectApi('HTTP physical sale','/api/admin/sales','employee',{items:[{product_id:p,quantity:1}],payment_method:'efectivo'},201);
 const promoApi=await expectApi('HTTP promo admin','/api/admin/promotions','admin',{name:'TEST NOVA HTTP PROMO',promotion_type:'producto',discount_type:'porcentaje',discount_value:10},201);
 await expectApi('HTTP promo employee denied','/api/admin/promotions','employee',{name:'TEST NOVA DENIED',promotion_type:'producto',discount_type:'porcentaje',discount_value:10},403);
 report.fixtures.push({type:'http-product',id:p,inventory:item});save();
 // Promotion scenarios use actual RPC and PostgreSQL, separate fixtures.
 const promoProduct=await product('PROMOTIONS',50),other=await product('INELIGIBLE',5);
 for(const spec of [{name:'percentage',type:'producto',discount:'porcentaje',value:10,total:90},{name:'fixed',type:'producto',discount:'monto_fijo',value:20,total:80},{name:'combo',type:'combo',price:70,total:70},{name:'minimum',type:'producto',discount:'porcentaje',value:10,min:200,reject:true},{name:'ineligible',type:'producto',discount:'porcentaje',value:10,other:true,reject:true},{name:'expired',type:'producto',discount:'porcentaje',value:10,expired:true,reject:true},{name:'inactive',type:'producto',discount:'porcentaje',value:10,inactive:true,reject:true},{name:'over-subtotal',type:'producto',discount:'monto_fijo',value:200,reject:true},{name:'zero-total',type:'producto',discount:'porcentaje',value:100,total:0}]){
  const promotion=crypto.randomUUID();await sql(`INSERT INTO promotions(id,name,promotion_type,discount_type,discount_value,combo_price,minimum_purchase,is_active,ends_at) VALUES(${q(promotion)},${q('TEST NOVA '+spec.name)},${q(spec.type)},${spec.discount?q(spec.discount):'NULL'},${spec.value??'NULL'},${spec.price??'NULL'},${spec.min??'NULL'},${!spec.inactive},${spec.expired?"now()-interval '1 hour'":'NULL'}); INSERT INTO promotion_products(promotion_id,product_id,quantity) VALUES(${q(promotion)},${q(promoProduct.product)},1)`);
  const stockBefore=await sql(`SELECT current_stock FROM inventory_items WHERE id=${q(promoProduct.item)}`);
  const result=await anon.rpc('create_order',orderArgs(spec.other?other.product:promoProduct.product,'TEST-NOVA-PROMO-'+spec.name,promotion));
  if(spec.reject){const count=await sql(`SELECT count(*) FROM orders WHERE idempotency_key=${q('TEST-NOVA-PROMO-'+spec.name)}`);rec('promotions',spec.name,!!result.error&&count==='0',{error:result.error,orderCount:count,stockBefore});}
  else{
   if(result.error) throw new Error(JSON.stringify(result.error));
   const order=await json(`SELECT row_to_json(o) FROM (SELECT id,total,discount_total,status FROM orders WHERE id=${q(result.data)})o`);
   const discounts=await json(`SELECT coalesce(json_agg(d),'[]') FROM (SELECT amount_applied,discount_type FROM order_discounts WHERE order_id=${q(result.data)})d`);
   const payResult=await service.rpc('create_payment',{p_order_id:result.data,p_customer_phone:'70000999'});
   const state=await json(`SELECT json_build_object('paymentCount',(SELECT count(*) FROM payments WHERE order_id=${q(result.data)}),'cashCount',(SELECT count(*) FROM cash_movements WHERE order_id=${q(result.data)}),'consumed',(SELECT count(*) FROM inventory_reservations WHERE order_id=${q(result.data)} AND status='consumed'),'stock',(SELECT current_stock FROM inventory_items WHERE id=${q(promoProduct.item)}))`);
   const ok=Number(order.total)===spec.total&&discounts.length===1&&(spec.total===0 ? order.status==='confirmado'&&!!payResult.error&&state.paymentCount===0&&state.cashCount===0&&state.consumed===1&&Number(state.stock)===Number(stockBefore)-1 : !payResult.error&&state.paymentCount===1);
   rec('promotions',spec.name,ok,{order,discounts,payment:payResult.data,error:payResult.error,stockBefore,state});
   if(spec.total===0){await expectApi('free order tracking','/api/orders/track','anon',{order_id:result.data,customer_phone:'70000999'},200);for(const new_status of ['en_preparacion','listo','finalizado'])await expectApi('free order '+new_status,'/api/admin/orders/'+result.data+'/status','employee',{new_status},200);}
  }
 }
 const one=await product('LAST STOCK',1);await pair('last-stock',`BEGIN;SELECT ${callOrder(one.product,'TEST-NOVA-LAST-A')};SELECT pg_sleep(0.7);COMMIT;`,`BEGIN;SELECT ${callOrder(one.product,'TEST-NOVA-LAST-B')};COMMIT;`,`SELECT json_build_object('orders',(SELECT count(*) FROM order_items WHERE product_id=${q(one.product)}),'reserved',(SELECT coalesce(sum(quantity),0) FROM inventory_reservations WHERE inventory_item_id=${q(one.item)} AND status='reserved'))`,(s,f)=>s.filter(x=>x.ok).length===1&&f.orders===1&&Number(f.reserved)===1);
 const same=await product('IDEMPOTENCY',10);await pair('same-key',`BEGIN;SELECT ${callOrder(same.product,'TEST-NOVA-SAME-KEY')};SELECT pg_sleep(0.7);COMMIT;`,`BEGIN;SELECT ${callOrder(same.product,'TEST-NOVA-SAME-KEY')};COMMIT;`,`SELECT json_build_object('orders',(SELECT count(*) FROM orders WHERE idempotency_key='TEST-NOVA-SAME-KEY'),'reservations',(SELECT count(*) FROM inventory_reservations WHERE inventory_item_id=${q(same.item)}))`,(s,f)=>s.every(x=>x.ok)&&f.orders===1&&f.reservations===1);
 const paymentStock=await product('PAYMENT CONCURRENCY',5);const po=await anon.rpc('create_order',orderArgs(paymentStock.product,'TEST-NOVA-CONCURRENT-PAY'));const paymentCall=`public.create_payment(${q(po.data)},'70000999')`;
 await pair('double-report',`BEGIN;SELECT id FROM ${paymentCall};SELECT pg_sleep(0.7);COMMIT;`,`BEGIN;SELECT id FROM ${paymentCall};COMMIT;`,`SELECT json_build_object('payments',count(*),'ids',json_agg(id)) FROM payments WHERE order_id=${q(po.data)}`,(s,f)=>s.every(x=>x.ok)&&f.payments===1);
 const payId=await sql(`SELECT id FROM payments WHERE order_id=${q(po.data)}`);
 await pair('double-confirm',authSql(`SELECT public.confirm_payment(${q(payId)});SELECT pg_sleep(0.7)`),authSql(`SELECT public.confirm_payment(${q(payId)})`),`SELECT json_build_object('status',(SELECT status FROM payments WHERE id=${q(payId)}),'stock',(SELECT current_stock FROM inventory_items WHERE id=${q(paymentStock.item)}),'consumed',(SELECT count(*) FROM inventory_reservations WHERE order_id=${q(po.data)} AND status='consumed'))`,(s,f)=>s.filter(x=>x.ok).length===1&&f.status==='confirmado'&&Number(f.stock)===4&&f.consumed===1);
 const exp=await product('EXPIRATION RACE',5);const eo=await anon.rpc('create_order',orderArgs(exp.product,'TEST-NOVA-EXPIRATION'));const ep=await service.rpc('create_payment',{p_order_id:eo.data,p_customer_phone:'70000999'});const expPay=ep.data[0].id;
 await sql(`UPDATE orders SET reserved_until=clock_timestamp()+interval '0.5 seconds' WHERE id=${q(eo.data)};UPDATE inventory_reservations SET expires_at=(SELECT reserved_until FROM orders WHERE id=${q(eo.data)}) WHERE order_id=${q(eo.data)}`);
 await pair('expiry-confirm',authSql(`SELECT id FROM orders WHERE id=${q(eo.data)} FOR UPDATE;SELECT pg_sleep(0.9);SELECT public.confirm_payment(${q(expPay)})`),`BEGIN;SELECT pg_sleep(0.6);SELECT public.release_expired_reservations(NULL);COMMIT;`,`SELECT json_build_object('order',(SELECT status FROM orders WHERE id=${q(eo.data)}),'payment',(SELECT status FROM payments WHERE id=${q(expPay)}),'stock',(SELECT current_stock FROM inventory_items WHERE id=${q(exp.item)}))`,(s,f)=>!s.some(x=>!x.ok&&x.error.includes('deadlock'))&&!(f.order==='cancelado'&&f.payment==='confirmado'));
 const sale=await product('PHYSICAL LAST',1);const saleCall=`public.create_physical_sale(${q(JSON.stringify([{product_id:sale.product,quantity:1}]))}::jsonb,NULL,NULL,NULL,NULL,'efectivo')`;
 await pair('double-physical',authSql(`SELECT id FROM ${saleCall};SELECT pg_sleep(0.7)`),authSql(`SELECT id FROM ${saleCall}`),`SELECT json_build_object('stock',(SELECT current_stock FROM inventory_items WHERE id=${q(sale.item)}),'sales',(SELECT count(*) FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=${q(sale.product)} AND o.order_type='fisica'))`,(s,f)=>s.filter(x=>x.ok).length===1&&Number(f.stock)===0&&f.sales===1);
} catch(e){report.errors.push({message:e.message,stack:e.stack});save();console.log('SETUP_OR_PHASE_ERROR',e.message);}
finally{save();console.log('SUMMARY',JSON.stringify(Object.fromEntries(['http','jwt','promotions','concurrency'].map(k=>[k,{tests:report[k].length,failed:report[k].filter(x=>!x.passed).length}]))));}

