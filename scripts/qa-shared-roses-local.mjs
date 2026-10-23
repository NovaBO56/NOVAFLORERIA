// Existing inventory architecture only. Synthetic fixtures; no reset or remote writes.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID, randomInt, createHash} from 'node:crypto';
import {execFileSync, spawn} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';

const lab=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/inventory-refunds-final-replay');
const read=name=>JSON.parse(fs.readFileSync(path.join(lab,name),'utf8').replace(/^\uFEFF/,''));
const cfg=read('status.private.json'), container='supabase_db_NOVA-LOCAL-INTEGRITY';
if(cfg.API_URL!=='http://127.0.0.1:62621'||fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))||
 !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab,'supabase/config.toml'),'utf8'))||
 execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='desarrollo-auditoria'||
 execFileSync('docker',['info','--format','{{.Name}}'],{encoding:'utf8'}).trim()!=='docker-desktop')throw Error('Requires existing unlinked LOCAL lab');
const service=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const admin=createClient(cfg.API_URL,cfg.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const login=await admin.auth.signInWithPassword(read('admin.credentials.private.json'));
if(login.error)throw Error('Synthetic LOCAL admin login failed');
const actor=login.data.user.id, tag=`TEST ROSAS ${Date.now()}`;
const report={tag,started:new Date().toISOString(),checks:[],states:[],fixtures:[],orders:[],races:[]};
const output=path.join(lab,`shared-roses-${Date.now()}.private.json`);
const save=()=>fs.writeFileSync(output,JSON.stringify(report,null,2));
function check(name,pass){report.checks.push({name,pass:Boolean(pass)});save();console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw Error(name);}
async function value(query){const r=await query;if(r.error)throw Error(`LOCAL query failed: ${r.error.message}`);return r.data;}
const sql=text=>execFileSync('docker',['exec','-i',container,'psql','-XAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:text,encoding:'utf8',maxBuffer:40*1024*1024}).trim();
const tables=['products','product_inventory_requirements','orders','order_items','payments','customers','inventory_items','inventory_lots','inventory_entries','inventory_waste','inventory_adjustments','inventory_movements','inventory_reservations','promotions'];
const before={};
for(const table of tables)before[table]=JSON.parse(sql(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]') FROM public.${table} t;`));
const digest=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
report.originals=Object.fromEntries(tables.map(table=>[table,{count:before[table].length,sha256:digest(before[table])}]));save();
let phone;
do{phone='00'+randomInt(100000,1000000);}while((await value(service.from('customers').select('id').eq('phone',phone))).length);
async function http(route,body){const response=await fetch('http://127.0.0.1:3116'+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});return{status:response.status,data:await response.json()};}
async function fixture(name,amounts,stock){
 const item=randomUUID(),products=amounts.map(()=>randomUUID());
 report.fixtures.push({name,item,products,amounts});save();
 await value(service.from('inventory_items').insert({id:item,name:`${tag} ${name}`,item_type:'flor',unit:'rosa',minimum_stock:0}));
 await value(service.from('products').insert(products.map((id,index)=>({id,name:`${tag} ${name} ${['Ramo romántico','Ramo pequeño','Caja floral','Arreglo especial'][index]??index}`,price:amounts[index]*10,is_active:false,is_available:true,is_sold_out:false}))));
 await value(service.from('product_inventory_requirements').insert(products.map((product_id,index)=>({product_id,inventory_item_id:item,quantity:amounts[index]}))));
 await value(service.from('products').update({is_active:true}).in('id',products));
 if(stock)await entry(item,stock);
 return{item,products};
}
const entry=(item,quantity)=>value(service.from('inventory_entries').insert({inventory_item_id:item,quantity,unit_cost:1,created_by:actor,notes:tag}));
const waste=(item,quantity)=>service.from('inventory_waste').insert({inventory_item_id:item,quantity,lot_id:null,reason:tag,created_by:actor});
const lines=ids=>ids.map(product_id=>({product_id,quantity:1}));
const available=(items,combine=false)=>value(service.rpc('get_product_availability',{p_items:items,p_combine:combine}));
async function create(items,promotion=null,viaHttp=false){
 const key=randomUUID();
 const r=viaHttp?await http('/api/orders',{customer_name:tag,customer_phone:phone,customer_message:'Método: Recojo en tienda',items,idempotency_key:key,promotion_id:promotion}):
  await service.rpc('create_order',{p_customer_name:tag,p_customer_phone:phone,p_customer_whatsapp:null,p_items:items,p_customer_message:'Método: Recojo en tienda',p_idempotency_key:key,p_promotion_id:promotion});
 const id=viaHttp?r.data.order_id:r.data;
 const error=viaHttp?r.status===201?null:r.data.message:r.error?.message;
 if(id){report.orders.push(id);save();}
 return{id,error,status:r.status};
}
const cancel=id=>value(admin.rpc('cancel_order',{p_order_id:id,p_reason:tag}));
const rawState=item=>JSON.parse(sql(`SELECT jsonb_build_object('stock',i.current_stock,'lots',coalesce((SELECT sum(remaining_quantity) FROM inventory_lots WHERE inventory_item_id=i.id),0),'reserved',coalesce((SELECT sum(quantity) FROM inventory_reservations WHERE inventory_item_id=i.id AND status='reserved' AND expires_at>clock_timestamp()),0)) FROM inventory_items i WHERE id='${item}';`));
async function state(name,expected,expectedCapacity){
 const data=rawState(main.item);data.free=Math.max(0,Math.min(data.stock,data.lots)-data.reserved);
 const capacity=(await available(lines(main.products))).map(row=>Number(row.available_quantity));
 report.states.push({name,...data,capacity});save();
 check(name+' stock/lots/reservations/free',Object.keys(expected).every(key=>data[key]===expected[key]));
 check(name+' capacity A/B/C/D',JSON.stringify(capacity)===JSON.stringify(expectedCapacity));
}
async function reconcile(item,name){
 check(name+' no negative stock/lots, no duplicate reservations',sql(`SELECT (SELECT current_stock>=0 FROM inventory_items WHERE id='${item}') AND NOT EXISTS(SELECT 1 FROM inventory_lots WHERE inventory_item_id='${item}' AND remaining_quantity<0) AND NOT EXISTS(SELECT 1 FROM inventory_reservations WHERE inventory_item_id='${item}' GROUP BY order_id,inventory_item_id HAVING count(*)>1);`)==='t');
 const s=rawState(item);check(name+' stock equals lots and covers reservations',s.stock===s.lots&&s.stock>=s.reserved);
}
async function race(name,item,requests){
 // Hold the actual shared inventory row so both real RPC sessions contend.
 const locker=spawn('docker',['exec','-i',container,'psql','-XAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 let output='';locker.stderr.on('data',()=>{});
 const locked=new Promise((resolve,reject)=>{locker.stdout.on('data',bytes=>{output+=bytes;if(output.includes('LOCKED'))resolve();});locker.once('error',reject);locker.once('exit',code=>{if(!output.includes('LOCKED'))reject(Error(`LOCAL locker failed ${code}`));});});
 const done=new Promise((resolve,reject)=>locker.once('exit',code=>code===0?resolve():reject(Error('LOCAL locker transaction failed'))));
 locker.stdin.end(`BEGIN; SELECT id FROM public.inventory_items WHERE id='${item}' FOR UPDATE; SELECT 'LOCKED'; SELECT pg_sleep(2); COMMIT;`);
 await locked;
 const pending=requests.map(request=>create(request.items,request.promotion));
 await new Promise(resolve=>setTimeout(resolve,100));
 const waiting=Number(sql("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE '%create_order%';"));
 const results=await Promise.all(pending);await done;
 report.races.push({name,waiting,results:results.map((r,index)=>({label:requests[index].label,...r}))});save();
 check(name+' two real blocked sessions observed',waiting===2);
 check(name+' exactly one winner and one rejected',results.filter(r=>r.id&&!r.error).length===1&&results.filter(r=>r.error).length===1);
 await reconcile(item,name);
 const winnerIndex=results.findIndex(r=>r.id&&!r.error),winner=results[winnerIndex];
 await cancel(winner.id);
 const requested=JSON.stringify(requests[winnerIndex].items);
 const expected=Number(sql(`SELECT sum(r.quantity*requested.quantity) FROM jsonb_to_recordset('${requested}'::jsonb) AS requested(product_id uuid,quantity numeric) JOIN product_inventory_requirements r ON r.product_id=requested.product_id WHERE r.inventory_item_id='${item}';`));
 check(name+' exact shared reservation quantity, released once',expected>0&&sql(`SELECT count(*)=1 AND sum(quantity)=${expected} AND bool_and(status='released') FROM inventory_reservations WHERE order_id='${winner.id}' AND inventory_item_id='${item}';`)==='t');
 await reconcile(item,name+' after cancellation');
}

// Required 30 roses, represented by two real entry lots (18 + 12).
const main=await fixture('Compartidas',[12,6,8,15],0);
await entry(main.item,18);await entry(main.item,12);
const [A,B,C,D]=main.products;
check('four recipes reference one shared rose item',Number(sql(`SELECT count(DISTINCT inventory_item_id) FROM product_inventory_requirements WHERE product_id IN (${main.products.map(id=>`'${id}'`).join(',')});`))===1);
await state('initial 30 roses',{stock:30,lots:30,reserved:0,free:30},[2,5,3,2]);
const initialCatalog=await http('/api/products?search='+encodeURIComponent(tag+' Compartidas'));
check('HTTP initial catalogue four products available',initialCatalog.status===200&&initialCatalog.data.products.length===4&&initialCatalog.data.products.every(p=>p.is_available&&!p.is_sold_out));
const first=await create(lines([A]),null,true);check('HTTP reserve romantic arrangement',first.status===201&&!first.error);
await state('A reserved 12',{stock:30,lots:30,reserved:12,free:18},[1,3,2,1]);
check('reserve has no physical outgoing movement',Number(sql(`SELECT count(*) FROM inventory_movements WHERE reference_type='order' AND reference_id='${first.id}' AND movement_type='salida';`))===0);
const payment=(await value(service.rpc('create_payment',{p_order_id:first.id,p_customer_phone:phone})))[0];
check('payment report remains pending',payment.status==='pendiente');
await value(admin.rpc('confirm_payment',{p_payment_id:payment.id}));
await state('A payment confirmed',{stock:18,lots:18,reserved:0,free:18},[1,3,2,1]);
check('confirmed order consumed exactly 12 once',Number(sql(`SELECT sum(quantity) FROM inventory_movements WHERE reference_type='order' AND reference_id='${first.id}' AND movement_type='salida';`))===12);
check('second confirmation rejected',Boolean((await admin.rpc('confirm_payment',{p_payment_id:payment.id})).error));
await reconcile(main.item,'after confirmation');
const second=await create(lines([B]),null,true);check('HTTP reserve small arrangement',Boolean(second.id));
await state('B pending',{stock:18,lots:18,reserved:6,free:12},[1,2,1,0]);
await cancel(second.id);
await state('B cancelled without stock restoration',{stock:18,lots:18,reserved:0,free:18},[1,3,2,1]);
const third=await create(lines([C]),null,true);check('HTTP reserve floral box',Boolean(third.id));
const pendingPayment=(await value(service.rpc('create_payment',{p_order_id:third.id,p_customer_phone:phone})))[0];
await state('C pending leaves 10 free',{stock:18,lots:18,reserved:8,free:10},[0,1,1,0]);
const cat=await http('/api/products?search='+encodeURIComponent(tag+' Compartidas'));
check('HTTP 10 roses: A/D sold out, B/C available',cat.status===200&&main.products.every((id,index)=>{const p=cat.data.products.find(p=>p.id===id);return p&&p.is_available===[false,true,true,false][index]&&p.is_sold_out===[true,false,false,true][index];}));
const da=await http('/api/products/'+A),db=await http('/api/products/'+B);
check('HTTP detail A sold out / B available',da.status===200&&da.data.product.is_sold_out&&!da.data.product.is_available&&db.status===200&&db.data.product.is_available);
const joint=await http('/api/products/availability',{items:lines([B,C])});
check('HTTP cart/checkout B+C needs 14, cannot share 10',joint.status===200&&joint.data.availability.every(row=>!row.is_available));
const promo=randomUUID(),combo=randomUUID();report.promotions=[promo,combo];save();
await value(service.from('promotions').insert([{id:promo,name:tag+' oferta A',promotion_type:'producto',discount_type:'porcentaje',discount_value:10},{id:combo,name:tag+' combo B+C',promotion_type:'combo',combo_price:100}]));
await value(service.from('promotion_products').insert([{promotion_id:promo,product_id:A,quantity:1},{promotion_id:combo,product_id:B,quantity:1},{promotion_id:combo,product_id:C,quantity:1}]));
const promotionResponse=await http('/api/promotions');
check('HTTP unavailable promotion and shared combo disabled',promotionResponse.status===200&&[promo,combo].every(id=>promotionResponse.data.promotions.find(p=>p.id===id).products.every(line=>!line.product.is_available)));
const denied=await create(lines([A]),null,true),deniedCombo=await create(lines([B,C]),combo,true);
check('HTTP final order validation blocks A and shared combo',denied.status===400&&deniedCombo.status===400);
check('no partial failed orders',Number(sql(`SELECT count(*) FROM orders WHERE guest_name='${tag}'`))===3);
const rejectedWaste=randomUUID();
const wasteError=await service.from('inventory_waste').insert({id:rejectedWaste,inventory_item_id:main.item,lot_id:null,quantity:11,reason:tag,created_by:actor});
check('waste cannot consume committed 8 roses',Boolean(wasteError.error)&&Number(sql(`SELECT count(*) FROM inventory_waste WHERE id='${rejectedWaste}'`))===0);
await state('rejected waste has no partial change',{stock:18,lots:18,reserved:8,free:10},[0,1,1,0]);
await value(waste(main.item,10));
await state('FIFO waste consumes only 10 free roses',{stock:8,lots:8,reserved:8,free:0},[0,0,0,0]);
check('FIFO waste traversed both lots',Number(sql(`SELECT count(DISTINCT lot_id) FROM inventory_movements WHERE inventory_item_id='${main.item}' AND movement_type='merma';`))===2);
await reconcile(main.item,'merma with pending payment');
await value(admin.rpc('reject_payment',{p_payment_id:pendingPayment.id,p_reason:tag}));
await state('rejected payment releases without physical restoration',{stock:8,lots:8,reserved:0,free:8},[0,1,1,0]);
await entry(main.item,22);
await state('restock returns to 30',{stock:30,lots:30,reserved:0,free:30},[2,5,3,2]);
await value(service.from('products').update({is_active:false}).eq('id',D));await entry(main.item,1);
await state('inactive D stays inactive after restock',{stock:31,lots:31,reserved:0,free:31},[2,5,3,0]);
check('inactive D stays absent from public detail',(await http('/api/products/'+D)).status===404);
check('automatic exhaustion never rewrites manual flags',sql(`SELECT bool_and(is_available AND NOT is_sold_out) FROM products WHERE id IN (${main.products.map(id=>`'${id}'`).join(',')});`)==='t');
const one=await fixture('Ultima rosa',[1,1],1);
await race('last rose',one.item,one.products.map((product,index)=>({label:`rose-${index}`,items:lines([product])})));
const twelve=await fixture('Competencia 12',[12,6],12);
await race('different products same limited material',twelve.item,[{label:'A uses 12',items:lines([twelve.products[0]])},{label:'B x2 uses 12',items:[{product_id:twelve.products[1],quantity:2}]}]);
await value(waste(main.item,17));
await race('shared combo versus A',main.item,[{label:'combo B+C uses 14',items:lines([B,C]),promotion:combo},{label:'A uses 12',items:lines([A])}]);
await entry(main.item,17);
await state('final restored synthetic availability',{stock:31,lots:31,reserved:0,free:31},[2,5,3,0]);
await reconcile(main.item,'final roses');
check('no double consumption in all audited orders',Number(sql(`SELECT coalesce(sum(quantity),0) FROM inventory_movements WHERE reference_type='order' AND reference_id IN (${report.orders.map(id=>`'${id}'`).join(',')}) AND movement_type='salida';`))===12);
for(const table of tables){
 const ids=before[table].map(row=>row.id);
 const after=ids.length?JSON.parse(sql(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]') FROM public.${table} t WHERE id IN (${ids.map(id=>`'${id}'`).join(',')});`)):[];
 check(`preserved pre-existing ${table}`,digest(before[table])===digest(after));
}
report.finished=new Date().toISOString();save();
console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,failed:report.checks.filter(c=>!c.pass).length,tag,orders:report.orders.length,products:report.fixtures.reduce((n,f)=>n+f.products.length,0)}));
