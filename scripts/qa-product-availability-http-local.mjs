// Continue only the synthetic fixtures created by qa-product-availability-local.mjs.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
const lab=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/inventory-refunds-final-replay');
const read=name=>JSON.parse(fs.readFileSync(path.join(lab,name),'utf8').replace(/^\uFEFF/,''));
const cfg=read('status.private.json');
if(cfg.API_URL!=='http://127.0.0.1:62621'||fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))||execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='desarrollo-auditoria')throw Error('LOCAL only');
const latest=fs.readdirSync(lab).filter(name=>/^availability-qa-\d+\.private.json$/.test(name)).sort().at(-1);
if(!latest)throw Error('Run RPC/SQL suite first');
const source=read(latest), fixture=source.fixtures[0];
const [p1,p2,inactive]=fixture.products;
const service=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const file=path.join(lab,'availability-http.private.json');
const mode=process.argv[2]??'--prepare';
const state=fs.existsSync(file)?read('availability-http.private.json'):{fixture,checks:[]};
if(state.fixture.tag!==fixture.tag)throw Error('Existing evidence belongs to another fixture; preserve it');
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2));
const check=(name,pass)=>{state.checks.push({name,pass:Boolean(pass)});save();console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw Error(name);};
async function value(query){const r=await query;if(r.error)throw Error(`LOCAL fixture: ${r.error.message}`);return r.data;}
async function http(route,body){const r=await fetch('http://127.0.0.1:3116'+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});return{status:r.status,data:await r.json()};}
const listing=()=>http('/api/products?search='+encodeURIComponent(fixture.tag));
if(mode==='--prepare'||mode==='--resume-prepare'){
 if(mode==='--prepare'){
 if(state.checks.length)throw Error('Do not repeat completed HTTP preparation');
 state.promotions??=[randomUUID(),randomUUID()];state.option??=randomUUID();save();
 await value(service.from('promotions').upsert([{id:state.promotions[0],name:fixture.tag+' oferta',promotion_type:'producto',discount_type:'porcentaje',discount_value:10},{id:state.promotions[1],name:fixture.tag+' combo',promotion_type:'combo',combo_price:25}]));
 await value(service.from('promotion_products').upsert([{promotion_id:state.promotions[0],product_id:p1,quantity:1},{promotion_id:state.promotions[1],product_id:p1,quantity:2},{promotion_id:state.promotions[1],product_id:p2,quantity:2}]));
 await value(service.from('customization_options').upsert({id:state.option,product_id:p1,option_type:'otro',name:fixture.tag+' extra',extra_price:2}));
 await value(service.from('customization_option_inventory_requirements').insert({customization_option_id:state.option,inventory_item_id:fixture.inventory_item,quantity:1}));
 }
 const catalog=await listing();check('HTTP catalogue active products have derived capacity 2',catalog.status===200&&catalog.data.products.length===2&&catalog.data.products.every(p=>p.available_quantity===2&&p.is_available));
 const detail=await http('/api/products/'+p1);check('HTTP detail agrees with catalogue',detail.status===200&&detail.data.product.available_quantity===2&&detail.data.product.is_available);
 check('HTTP inactive product remains 404',(await http('/api/products/'+inactive)).status===404);
 const combo=await http('/api/products/availability',{items:[{product_id:p1,quantity:2},{product_id:p2,quantity:2}]});check('HTTP cart protects shared ingredients',combo.status===200&&combo.data.availability.every(p=>!p.is_available));
 const options=await http('/api/products/availability',{items:[{product_id:p1,quantity:2,customization_option_ids:[state.option]}]});check('HTTP customization included in ingredient demand',options.status===200&&!options.data.availability[0].is_available);
 const promos=await http('/api/promotions');check('HTTP shared-ingredient combo unavailable before build',promos.status===200&&promos.data.promotions.find(p=>p.id===state.promotions[1]).products.every(line=>!line.product.is_available));
 check('HTTP invalid availability input is 400',(await http('/api/products/availability',{items:[{product_id:p1,quantity:0}]})).status===400);
 const malformed=await fetch('http://127.0.0.1:3116/api/products/availability',{method:'POST',headers:{'content-type':'application/json'},body:'{'});check('HTTP malformed availability JSON is 400',malformed.status===400);
 check('invalid recipe cannot activate',Boolean((await service.from('products').update({is_active:true}).eq('id',fixture.products[3])).error));
 console.log(JSON.stringify({tag:fixture.tag,product:p1}));
}else if(mode==='--reserve'){
 if(state.order)throw Error('Reservation already created');
 const body={customer_name:fixture.tag+' HTTP',customer_phone:'00062832',customer_message:'Método: Recojo en tienda',items:[{product_id:p1,quantity:2}],idempotency_key:randomUUID()};
 const created=await http('/api/orders',body);check('HTTP normal order creates actual LOCAL reservation',created.status===201&&Boolean(created.data.order_id));state.order=created.data.order_id;save();
 const retry=await http('/api/orders',body);check('HTTP retry recovers same reserved order',retry.status===201&&retry.data.order_id===state.order);
 const catalog=await listing();check('HTTP reserved last units: catalogue sold out',catalog.status===200&&catalog.data.products.every(p=>p.is_sold_out&&!p.is_available));
 const detail=await http('/api/products/'+p1);check('HTTP reserved last units: detail sold out',detail.status===200&&detail.data.product.is_sold_out&&!detail.data.product.is_available);
 const promos=await http('/api/promotions');check('14 HTTP promotion cannot buy sold-out product',promos.status===200&&promos.data.promotions.find(p=>p.id===state.promotions[0]).products.every(line=>!line.product.is_available));
 const invalid=await http('/api/orders',{...body,idempotency_key:randomUUID(),items:[{product_id:p2,quantity:1}]});check('15 order API agrees: no extra sale',invalid.status===400);
 const record=await value(service.from('orders').select('customer_id').eq('id',state.order).single());check('HTTP reservation does not materialize customer',record.customer_id===null);
}else if(mode==='--release'){
 const admin=createClient(cfg.API_URL,cfg.ANON_KEY,{auth:{persistSession:false}});
 const login=await admin.auth.signInWithPassword(read('admin.credentials.private.json'));if(login.error)throw Error('LOCAL admin login');
 check('HTTP fixture cancellation succeeds',!(await admin.rpc('cancel_order',{p_order_id:state.order,p_reason:fixture.tag})).error);
 const catalog=await listing();check('HTTP released units recover automatically',catalog.status===200&&catalog.data.products.every(p=>p.available_quantity===2&&p.is_available));
}else throw Error('Unknown mode');
save();console.log(JSON.stringify({passed:state.checks.filter(c=>c.pass).length,failed:state.checks.filter(c=>!c.pass).length}));
