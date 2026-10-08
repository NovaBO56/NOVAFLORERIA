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
const save=()=>fs.writeFileSync(root+'/certification/FREE_HTTP_SECURITY_037.json',JSON.stringify(report,null,2));
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
Object.assign(users,JSON.parse(fs.readFileSync(root+'/private/auth-sessions.json','utf8').replace(/^\uFEFF/,'')));
const fixture=await json("SELECT json_build_object('promotion',promotion_id,'product',product_id) FROM promotion_products WHERE promotion_id=(SELECT id FROM promotions WHERE name='TEST NOVA zero-total')");
const payload={customer_name:'TEST NOVA HTTP FREE',customer_phone:'70000999',idempotency_key:'TEST-NOVA-HTTP-FREE-FINAL',promotion_id:fixture.promotion,items:[{product_id:fixture.product,quantity:1}]};
const hs=await Promise.all([api('/api/orders','anon',payload),api('/api/orders','anon',payload)]);const oid=hs[0].data.order_id;
rec('http','free concurrent HTTP creation',hs.every(r=>r.status===201)&&hs[0].data.order_id===hs[1].data.order_id,{responses:hs});
if(!oid)throw Error('HTTP free failed '+JSON.stringify(hs));
const final=await json(`SELECT json_build_object('status',(SELECT status FROM orders WHERE id=${q(oid)}),'total',(SELECT total FROM orders WHERE id=${q(oid)}),'payments',(SELECT count(*) FROM payments WHERE order_id=${q(oid)}),'cash',(SELECT count(*) FROM cash_movements WHERE order_id=${q(oid)}),'discount',(SELECT sum(amount_applied) FROM order_discounts WHERE order_id=${q(oid)}),'consumed',(SELECT count(*) FROM inventory_reservations WHERE order_id=${q(oid)} AND status='consumed'),'movements',(SELECT json_agg(json_build_object('actor',created_by,'quantity',quantity,'reference',reference_id)) FROM inventory_movements WHERE reference_type='order' AND reference_id=${q(oid)}))`);
rec('promotions','free HTTP state and system provenance',final.status==='confirmado'&&Number(final.total)===0&&final.payments===0&&final.cash===0&&Number(final.discount)===100&&final.consumed===1&&final.movements.length===1&&final.movements[0].actor===null,final);
await expectApi('free HTTP tracking','/api/orders/track','anon',{order_id:oid,customer_phone:'70000999'},200);
await expectApi('free HTTP payment attempt rejected','/api/orders/'+oid+'/payment','anon',{customer_phone:'70000999'},400);
for(const new_status of ['en_preparacion','listo','finalizado'])await expectApi('free HTTP advance '+new_status,'/api/admin/orders/'+oid+'/status','employee',{new_status},200);
const clients={anon,employee:createClient(config.API_URL,config.ANON_KEY,{global:{headers:{Authorization:'Bearer '+users.employee.token}},auth:{persistSession:false}}),inactive:createClient(config.API_URL,config.ANON_KEY,{global:{headers:{Authorization:'Bearer '+users.inactive.token}},auth:{persistSession:false}})};
for(const [role,client] of Object.entries(clients)){const r=await client.rpc('consume_order_reservations',{p_order_id:oid,p_actor_id:users.admin.id});rec('jwt',role+' dangerous new helper denied',r.error?.code==='42501',{error:r.error});}
const edit=await service.from('orders').update({request_contract:{tampered:true}}).eq('id',oid);rec('jwt','request snapshot immutable',edit.error?.code==='P0001'&&edit.error.message.includes('inmutable'),{error:edit.error});
const item=await sql('SELECT inventory_item_id FROM inventory_reservations WHERE order_id='+q(oid)+' LIMIT 1');const movement=await service.from('inventory_movements').insert({inventory_item_id:item,movement_type:'salida',quantity:1,reference_type:'test',reference_id:oid,created_by:null});rec('jwt','unattributed non-free movement denied',movement.error?.code==='P0001',{error:movement.error});
console.log('FREE HTTP/security complete');
