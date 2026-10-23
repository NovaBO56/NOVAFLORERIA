// Synthetic LOCAL QA only. Raw evidence/credentials never enter the repository.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServerClient} from '@supabase/ssr';
const lab=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/inventory-refunds-final-replay');
const read=file=>JSON.parse(fs.readFileSync(path.join(lab,file),'utf8').replace(/^\uFEFF/,''));
const config=read('status.private.json'),fixture=read('florist-dedications.private.json');
if(config.API_URL!=='http://127.0.0.1:62621'||fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))||execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='desarrollo-auditoria')throw Error('Only authorized unlinked LOCAL lab');
const file=path.join(lab,'recommendations-20261022.private.json');
const report=fs.existsSync(file)?read(path.basename(file)):{tag:'TEST COMPLEMENTS '+Date.now(),checks:[],http:[],operations:{},setup:{},orders:{},cases:{}};
const save=()=>{fs.writeFileSync(file+'.tmp',JSON.stringify(report,null,2));if(fs.existsSync(file))fs.copyFileSync(file,file+'.previous');fs.renameSync(file+'.tmp',file);};
const sql=q=>{if(!/^SELECT\b/.test(q)||/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b/i.test(q))throw Error('Read only verification SQL');return execFileSync('docker',['exec','-i','supabase_db_NOVA-LOCAL-INTEGRITY','psql','-XAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:q,encoding:'utf8'}).trim();};
const cookies={};
let concurrentStockPair=false;
for(const role of ['admin','employee']){const jar=new Map();const auth=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});const result=await auth.auth.signInWithPassword(read(role+'.credentials.private.json'));if(result.error)throw Error('LOCAL Auth failed');cookies[role]=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');}
async function http(route,body,role='anon',method=body===undefined?'GET':'POST'){
 if(route==='/api/orders' && method==='POST' && !concurrentStockPair){
   // Respect the existing 10 attempts / five minutes. Never spoof client IPs.
   const next=Math.max(Date.now(),(report.lastCreateAttempt ?? 0)+31000);
   while(Date.now()<next)await new Promise(resolve=>setTimeout(resolve,Math.min(1000,next-Date.now())));
   report.lastCreateAttempt=Date.now();save();
 }
 const r=await fetch('http://127.0.0.1:3116'+route,{method,headers:{'content-type':'application/json',...(cookies[role]?{cookie:cookies[role]}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
 const result={status:r.status,data:await r.json()};report.http.push({at:new Date().toISOString(),route,method,role,body,...result});save();return result;
}
function check(name,ok){report.checks.push({name,pass:Boolean(ok)});save();console.log((ok?'PASS ':'FAIL ')+name);if(!ok)throw Error(name);}
async function once(key,fn){if(report.operations[key]?.done)return report.operations[key].result;if(report.operations[key]?.started)throw Error('Uncertain previous operation '+key+'; inspect private evidence before retry');report.operations[key]={started:true,key:randomUUID()};save();const result=await fn(report.operations[key].key);report.operations[key]={...report.operations[key],done:true,result};save();return result;}
const stock=id=>Number(sql(`SELECT current_stock FROM inventory_items WHERE id='${id}'`));
const order=id=>JSON.parse(sql(`SELECT to_jsonb(o) FROM orders o WHERE id='${id}'`));
const line=(id,quantity=1,dedications)=>({product_id:id,quantity,...(dedications?{dedications}:{})});
async function create(name,items,promotion_id=null){
 const phone=report.orders[name]?.phone ?? '00044'+String(Object.keys(report.orders).length+100);
 const result=await once('order-'+name,key=>http('/api/orders',{customer_name:report.tag+' '+name,customer_phone:phone,customer_message:'Método: Retiro en tienda',items,promotion_id,idempotency_key:key}));
 if(result.status===201){report.orders[name]={id:result.data.order_id,phone,items};save();}return result;
}
async function cancel(name){const r=await once('cancel-'+name,()=>http(`/api/admin/orders/${report.orders[name].id}/cancel`,{reason:report.tag+' liberación sintética'},'employee'));check('cancel '+name,r.status===200);}
async function pay(name,slot='qr_1'){const o=report.orders[name];const r=await once('pay-'+name,()=>http(`/api/orders/${o.id}/payment`,{customer_phone:o.phone,qr_slot:slot}));check('report '+name,r.status===200);o.payment=r.data.payment.id;save();return r;}
async function complete(name){await pay(name);const o=report.orders[name];check('confirm '+name,(await once('confirm-'+name,()=>http(`/api/admin/payments/${o.payment}/confirm`,{},'employee'))).status===200);for(const new_status of ['en_preparacion','listo','finalizado'])check(new_status+' '+name,(await once(new_status+'-'+name,()=>http(`/api/admin/orders/${o.id}/status`,{new_status},'employee'))).status===200);}
async function material(key,name,type,quantity,card=false){
 const r=await once('material-'+key,()=>http('/api/admin/inventory/items',{name:report.tag+' '+name,item_type:type,unit:'unidad',minimum_stock:2,is_dedication_card:card},'admin'));check('create material '+key,r.status===201);report.setup[key]=r.data.item.id;save();
 check('entry '+key,(await once('entry-'+key,()=>http('/api/admin/inventory/entries',{inventory_item_id:r.data.item.id,quantity,unit_cost:2,notes:report.tag},'employee'))).status===201);
}
async function product(key,name,price,requirements){
 const r=await once('product-'+key,()=>http('/api/admin/products',{name:report.tag+' '+name,price,description:'Producto sintético LOCAL con receta compartida',is_active:false,is_available:false},'admin'));check('create product '+key,r.status===201);const id=r.data.product.id;report.setup[key]=id;save();
 for(const [inventory_item_id,quantity] of requirements)check('recipe '+key,(await once('recipe-'+key+'-'+inventory_item_id,()=>http(`/api/admin/products/${id}/inventory-requirements`,{inventory_item_id,quantity},'admin'))).status===201);
 check('publish '+key,(await once('publish-'+key,()=>http(`/api/admin/products/${id}`,{is_active:true,is_available:true},'admin','PATCH'))).status===200);
}
const mode=process.argv[2]??'--setup';
if(mode==='--setup'){
 // Four narrowly scoped fixtures, not a copy of TEST BO/LAB100. Reuse its bear.
 await material('rose','Rosa roja','flor',80);
 await material('balloonMaterial','Globo corazón','componente',15);
 await material('chocolateMaterial','Caja chocolates','componente',15);
 await material('cardMaterial','Tarjeta','insumo',20,true);
 await product('bouquet','Ramo de rosas',120,[[report.setup.rose,3]]);
 await product('balloon','Globo corazón',20,[[report.setup.balloonMaterial,1],[report.setup.rose,1]]);
 await product('chocolate','Chocolates',35,[[report.setup.chocolateMaterial,1]]);
 await product('card','Tarjeta con dedicatoria',5,[[report.setup.cardMaterial,1]]);
 report.setup.bear=fixture.products[51].id;save();
 check('admin configure recommendations',(await http(`/api/admin/products/${report.setup.bouquet}/recommendations`,{product_ids:[report.setup.bear,report.setup.balloon,report.setup.chocolate,report.setup.card]},'admin','PUT')).status===200);
 check('employee denied recommendations',(await http(`/api/admin/products/${report.setup.bouquet}/recommendations`,{product_ids:[]},'employee','PUT')).status===403);
 check('public projection max4',(await http(`/api/products/${report.setup.bouquet}/recommendations`)).data.products?.length===4);
 check('availability bouquet',(await http(`/api/products/${report.setup.bouquet}`)).data.product?.available_quantity===26);
 report.cases['01']='PASS API material+entry';report.cases['02']='PASS API product+recipe';report.cases['03']='PASS API computed availability';save();
}else if(mode==='--commerce'){
 const s=report.setup;
 for(const [name,extras] of [['04',[]],['05',[s.bear]],['06',[s.balloon]],['07',[s.chocolate]],['08',[s.bear,s.balloon,s.chocolate]]]){
   const before=stock(s.rose);check('order '+name,(await create(name,[line(s.bouquet),...extras.map(id=>line(id))])).status===201);check('no consume before payment '+name,stock(s.rose)===before);await cancel(name);report.cases[name]='PASS API order + cancellation';save();
 }
 const available=await http('/api/products/availability',{items:[line(s.bouquet,26),line(s.balloon,3)],combine:true});
 check('shared material combined rejects overstock',available.status===200&&available.data.availability.some(p=>!p.is_available));report.cases['11']='PASS API combined shared rose';
 // Reservations only: exhaust this dedicated ingredient without consuming it.
 check('hold all roses',(await create('hold',[line(s.bouquet,26),line(s.balloon,2)])).status===201);
 check('out of stock complement rejected',(await create('09',[line(s.balloon)])).status===400);report.cases['09']='PASS API';
 check('out of stock main rejected',(await create('10',[line(s.bouquet)])).status===400);report.cases['10']='PASS API';await cancel('hold');
 check('hold 79 roses',(await create('race-hold',[line(s.bouquet,26),line(s.balloon)])).status===201);
 let race=await Promise.all([create('12a',[line(s.balloon)]),create('12b',[line(s.balloon)])]);
 if(race.some(r=>r.status===429)){
   report.raceEnvironmentIncident='Initial race hit rate limit from shared test IP; not a stock result';save();
   for(const name of ['12a','12b'])if(report.orders[name])await cancel(name);await cancel('race-hold');
   report.raceCooldownUntil ??= Date.now()+301000;save();
   console.log('Waiting for the normal five-minute rate-limit window before the isolated stock retry.');
   while(Date.now()<report.raceCooldownUntil)await new Promise(resolve=>setTimeout(resolve,1000));
   check('final retry hold 79 roses',(await create('race-hold-final',[line(s.bouquet,26),line(s.balloon)])).status===201);
   // Two simultaneous real connections; two attempts fit the freshly elapsed quota.
   concurrentStockPair=true;
   race=await Promise.all([create('12a-final',[line(s.balloon)]),create('12b-final',[line(s.balloon)])]);
   concurrentStockPair=false;report.lastCreateAttempt=Date.now();save();
   for(const name of ['12a-final','12b-final'])if(report.orders[name])await cancel(name);await cancel('race-hold-final');
 }else{for(const name of ['12a','12b'])if(report.orders[name])await cancel(name);await cancel('race-hold');}
 check('last unit exactly one winner',race.filter(r=>r.status===201).length===1&&race.filter(r=>r.status===400).length===1);report.cases['12']='PASS two real HTTP clients 201/400';
 const freePromotion=fixture.promotions.find(p=>p.kind==='free')?.id;
 if(!freePromotion)throw Error('Existing free promotion fixture missing');
 const invalid=await create('15',[line(s.bouquet)],freePromotion);
 check('ineligible promotion rejects',invalid.status===400);report.cases['15']='PASS API';
 const cardWrite=[{message:'TEST Complemento: gracias por acompañarme.',signature:'TEST Familia'}];
 check('card order write',(await create('18',[line(s.bouquet),line(s.card,1,cardWrite)])).status===201);
 const detail=await http(`/api/admin/orders/${report.orders['18'].id}`,undefined,'employee');check('employee sees exact dedication',detail.data.order.order_items.some(i=>i.dedications?.[0]?.message===cardWrite[0].message));await cancel('18');report.cases['18']='PASS API + employee Auth';
 check('blank card',(await create('19',[line(s.card,1,[{message:'',signature:''}])])).status===201);await cancel('19');report.cases['19']='PASS API';
 check('normal checkout QR',(await create('20',[line(s.bouquet),line(s.balloon)])).status===201);report.cases['20']='PASS API';
 const before=stock(s.rose);await pay('20','qr_2');check('pending no customer or consumption',order(report.orders['20'].id).customer_id===null&&stock(s.rose)===before);report.cases['21']='PASS API pending';
 const trackBefore=await http('/api/orders/track',{order_id:report.orders['20'].id,customer_phone:report.orders['20'].phone});check('pending receipt hidden',!trackBefore.data.order.receipt_token);
 await complete('20');check('exact shared consumption',stock(s.rose)===before-4);report.cases['22']='PASS manual confirm API';report.cases['24']='PASS preparation API';report.cases['25']='PASS pickup final API';
 const tracked=await http('/api/orders/track',{order_id:report.orders['20'].id,customer_phone:report.orders['20'].phone});check('tracking final receipt',tracked.status===200&&tracked.data.order.status==='finalizado'&&Boolean(tracked.data.order.receipt_token));report.cases['26']='PASS tracking API';
 check('reject order create',(await create('23',[line(s.chocolate)])).status===201);await pay('23');const rejectBefore=stock(s.chocolateMaterial);check('manual reject',(await once('reject-23',()=>http(`/api/admin/payments/${report.orders['23'].payment}/reject`,{reason:report.tag+' rechazo LOCAL'},'employee'))).status===200);check('reject no consumption',stock(s.chocolateMaterial)===rejectBefore);report.cases['23']='PASS API';
 const returned=await once('return-20',key=>http(`/api/admin/orders/${report.orders['20'].id}/returns`,{type:'reintegro',amount:10,reason:report.tag+' prueba reintegro',idempotency_key:key},'admin'));check('refund',returned.status===201);report.cases['27']='PASS API refund; physical return separately pending';
 report.cases['13']='PENDING browser';report.cases['14']='PENDING browser';report.cases['16']='PENDING eligible promotion';report.cases['17']='PENDING incomplete combo';report.cases['28']='PENDING browser';report.cases['29']='PENDING browser';report.cases['30']='PENDING browser';save();
}else if(mode==='--extras'){
 const s=report.setup;
 const promo=read('commerce30.private.json').setup;
 const eligible=await create('16',[line(s.bear)],promo.fixed);check('eligible promotion',eligible.status===201&&Number(order(report.orders['16'].id).discount_total)===10);await cancel('16');report.cases['16']='PASS API fixed discount10';
 const promotions=await http('/api/promotions');
 const combo=promotions.data.promotions.find(p=>p.id===promo.flowerCombo);
 if(!combo?.products?.length)throw Error('Existing combo fixture missing');
 check('incomplete combo rejects',(await create('17',[line(combo.products[0].product_id)],combo.id)).status===400);report.cases['17']='PASS API';
 const before=stock(s.rose);
 check('physical return',(await once('physical-return-20',key=>http(`/api/admin/orders/${report.orders['20'].id}/returns`,{type:'retorno_fisico',amount:0,reason:report.tag+' materiales devueltos en prueba LOCAL',idempotency_key:key},'admin'))).status===201);
 check('physical return restores exactly4 roses',stock(s.rose)===before+4);report.cases['27']='PASS API refund10 + audited physical return';
 check('waste material',(await once('waste-rose',()=>http('/api/admin/inventory/waste',{inventory_item_id:s.rose,quantity:1,reason:report.tag+' rosa dañada sintética'},'employee'))).status===201);
 check('restock material',(await once('restock-rose',()=>http('/api/admin/inventory/entries',{inventory_item_id:s.rose,quantity:1,unit_cost:2,notes:report.tag+' reposición'},'employee'))).status===201);
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const kind of ['sales','products-sold','inventory','waste','cash'])check('report '+kind,(await http(`/api/admin/reports/${kind}?from=${date}&to=${date}`,undefined,'admin')).status===200);
 save();
}else if(mode==='--reconcile'){
 check('no negative stock',Number(sql('SELECT count(*) FROM inventory_items WHERE current_stock<0'))===0);
 check('lots reconcile',Number(sql('SELECT count(*) FROM inventory_items i WHERE abs(i.current_stock-coalesce((SELECT sum(l.remaining_quantity) FROM inventory_lots l WHERE l.inventory_item_id=i.id),0))>0.0001'))===0);
 const ids=Object.values(report.orders).map(o=>`'${o.id}'`).join(',');
 report.totals=JSON.parse(sql(`SELECT jsonb_build_object('orders',(SELECT count(*) FROM orders WHERE id IN(${ids})),'gross',coalesce(sum(amount) FILTER(WHERE kind='sale'),0),'refunds',coalesce(sum(amount) FILTER(WHERE kind='refund'),0)) FROM sales_ledger WHERE order_id IN(${ids})`));save();
 console.log(JSON.stringify({cases:report.cases,checks:report.checks.length,failed:report.checks.filter(c=>!c.pass).length,totals:report.totals}));
}else throw Error('Unknown mode');
