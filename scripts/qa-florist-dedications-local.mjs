// LOCAL synthetic fixtures and real Auth/HTTP/RPC/SQL. Never reset or delete LAB100.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {products as catalog,inventoryItems} from './lab50-catalog.mjs';

const lab=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/inventory-refunds-final-replay');
const read=file=>JSON.parse(fs.readFileSync(path.join(lab,file),'utf8').replace(/^\uFEFF/,''));
const cfg=read('status.private.json'),app='http://127.0.0.1:3116',container='supabase_db_NOVA-LOCAL-INTEGRITY';
if(cfg.API_URL!=='http://127.0.0.1:62621'||fs.existsSync(path.join(lab,'supabase/.temp/project-ref'))||
 !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab,'supabase/config.toml'),'utf8'))||
 execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='codex/inventory-refunds-dashboard-2')throw Error('Requires unlinked existing LOCAL lab and correct branch');
const service=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const file=path.join(lab,'florist-dedications.private.json'),mode=process.argv[2]??'--prepare';
const report=fs.existsSync(file)?read('florist-dedications.private.json'):{tag:`TEST BO ${Date.now()}`,checks:[],scenarios:[],products:[],supplies:{},orders:[],payments:[],promotions:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
function check(name,pass){report.checks.push({name,pass:Boolean(pass)});save();console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw Error(name);}
function scenario(name){report.scenarios.push(name);save();console.log('SCENARIO '+name);}
async function value(query){const r=await query;if(r.error)throw Error('LOCAL query: '+r.error.message);return r.data;}
const sql=input=>execFileSync('docker',['exec','-i',container,'psql','-XAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',maxBuffer:40000000}).trim();
const cookies={},clients={};
for(const role of ['admin','employee']){
 const jar=new Map();const client=createServerClient(cfg.API_URL,cfg.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
 const login=await client.auth.signInWithPassword(read(role+'.credentials.private.json'));if(login.error)throw Error('Synthetic LOCAL Auth failed');
 clients[role]=client;cookies[role]=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
}
async function http(route,body,role='anon',method=body===undefined?'GET':'POST'){
 const r=await fetch(app+route,{method,headers:{'content-type':'application/json',...(cookies[role]?{cookie:cookies[role]}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
 return{status:r.status,data:await r.json()};
}
const tables=['products','product_inventory_requirements','order_items','orders','payments','customers','inventory_items','inventory_lots','inventory_entries','inventory_waste','inventory_adjustments','inventory_movements','inventory_reservations','promotions'];
const hash=data=>createHash('sha256').update(JSON.stringify(data)).digest('hex');
const rows=table=>JSON.parse(sql(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]') FROM public.${table} t;`));
const entry=(item,quantity,cost=1)=>http('/api/admin/inventory/entries',{inventory_item_id:item,quantity,unit_cost:cost,supplier_name:report.tag+' proveedor sintético',notes:report.tag},'admin');
const d=(message='Que tengas un hermoso día.\nCon todo nuestro cariño.',signature='Familia de prueba')=>({message,signature});
const item=(index,dedications,quantity=1)=>({product_id:report.products[index].id,quantity,...(dedications?{dedications}:{})});
async function create(items,promotion=null,viaHttp=false,fulfillment='retiro',key=randomUUID()){
 const body={customer_name:report.tag,customer_phone:'00076251',customer_message:fulfillment==='entrega'?'Método: Entrega por coordinar\nTEST dirección sintética LOCAL':'Método: Retiro en tienda',items,idempotency_key:key,promotion_id:promotion};
 const r=viaHttp?await http('/api/orders',body):await service.rpc('create_order',{p_customer_name:body.customer_name,p_customer_phone:body.customer_phone,p_customer_whatsapp:null,p_items:items,p_customer_message:body.customer_message,p_idempotency_key:key,p_promotion_id:promotion});
 const id=viaHttp?r.data.order_id:r.error?null:r.data;
 if(id&&!report.orders.includes(id)){report.orders.push(id);save();}
 return{id,status:r.status,error:viaHttp?r.data.message:r.error?.message};
}
const order=id=>value(service.from('orders').select('*').eq('id',id).single());
const cancel=id=>http(`/api/admin/orders/${id}/cancel`,{reason:report.tag},'admin');
const stock=id=>Number(sql(`SELECT current_stock FROM inventory_items WHERE id='${id}';`));
const reserve=id=>Number(sql(`SELECT coalesce(sum(quantity),0) FROM inventory_reservations WHERE inventory_item_id='${id}' AND status='reserved' AND expires_at>clock_timestamp();`));
const countOrders=()=>Number(sql(`SELECT count(*) FROM orders WHERE guest_name='${report.tag}';`));
async function pay(id,slot){const r=await http(`/api/orders/${id}/payment`,{customer_phone:'00076251',qr_slot:slot});if(r.data.payment?.id&&!report.payments.includes(r.data.payment.id)){report.payments.push(r.data.payment.id);save();}return r;}

if(mode==='--prepare'){
 if(report.prepared||report.products.length)throw Error('Fixture already exists. Preserve it; run --verify once.');
 report.originals=Object.fromEntries(tables.map(table=>{const data=rows(table);return[table,{ids:data.map(r=>r.id),count:data.length,sha256:hash(data)}];}));save();
 // Reuse the realistic shared-material catalog definitions; all new rows carry TEST BO.
 for(const source of [...inventoryItems,{key:'tarjeta',name:'Tarjeta de dedicatoria',unit:'unidad',item_type:'insumo',minimum_stock:50}]){
  const r=await http('/api/admin/inventory/items',{name:`${report.tag} · ${source.name}`,sku:`BO-${report.tag.split(' ').at(-1)}-${source.key}`,item_type:source.item_type,unit:source.unit,minimum_stock:source.minimum_stock??10,is_dedication_card:source.key==='tarjeta'},'admin');
  check('create synthetic supply '+source.key,r.status===201);report.supplies[source.key]=r.data.item.id;save();
  check('entry and FIFO lot '+source.key,(await entry(r.data.item.id,source.item_type==='flor'?8000:4000,source.item_type==='flor'?5:source.key==='oso'?25:2)).status===201);
 }
 scenario('01 Admin registra tarjeta y entradas con clasificación explícita');
 const category=await value(service.from('categories').insert({name:report.tag+' · Florería boliviana',description:'Catálogo sintético LOCAL. Precios demostrativos en Bs.'}).select('id').single());report.category=category.id;save();
 const templates=catalog.slice(0,50).map((source,index)=>({...source,name:source.name.split(' · ').slice(1).join(' · '),cards:index%3===0?0:1}));
 for(let index=50;index<60;index++)templates.push({name:['Peluche con tarjeta','Peluche sin tarjeta','Dos mensajes especiales','Detalle con personalización','Rosas para mamá','Regalo de cumpleaños','Caja de agradecimiento','Abrazo con girasol','Rosas y dos tarjetas','Detalle de última unidad'][index-50],price:[55,50,80,40,125,180,220,90,150,35][index-50],recipe:[{itemKey:index===59?'papel':index<54?'oso':'rosas_rojas',quantity:index===59?1:index<54?1:6}],cards:[1,0,2,0,1,1,1,1,2,0][index-50]});
 for(const [index,source] of templates.entries()){
  const id=randomUUID();report.products.push({id,index,name:`${report.tag} · ${String(index+1).padStart(2,'0')} · ${source.name}`,price:source.price,cards:source.cards});save();
  await value(service.from('products').insert({id,name:report.products[index].name,description:'Producto sintético de una florería boliviana para QA LOCAL. Precio de demostración en Bs; no es oferta comercial real.',price:source.price,category_id:category.id,is_active:false,is_available:true,is_sold_out:false,catalog_order:1000+index}));
  await value(service.from('product_inventory_requirements').insert([...source.recipe.map(r=>({product_id:id,inventory_item_id:report.supplies[r.itemKey],quantity:r.quantity})),...(source.cards?[{product_id:id,inventory_item_id:report.supplies.tarjeta,quantity:source.cards}]:[])]));
  await value(service.from('products').update({is_active:true}).eq('id',id));
 }
 report.option=(await value(service.from('customization_options').insert({product_id:report.products[53].id,option_type:'otro',name:'Agregar tarjeta de dedicatoria de prueba',extra_price:0}).select('id').single())).id;
 await value(service.from('customization_option_inventory_requirements').insert({customization_option_id:report.option,inventory_item_id:report.supplies.tarjeta,quantity:1}));
 for(const [kind,body,lines] of [
  ['percentage',{promotion_type:'producto',discount_type:'porcentaje',discount_value:10},[50]],
  ['combo',{promotion_type:'combo',combo_price:90},[50,51]],
  ['minimum',{promotion_type:'producto',discount_type:'monto_fijo',discount_value:10,minimum_purchase:100},[50]],
  ['free',{promotion_type:'producto',discount_type:'porcentaje',discount_value:100},[50]],
 ]){
  const p=await value(service.from('promotions').insert({name:`${report.tag} ${kind}`,...body}).select('id').single());report.promotions.push({kind,id:p.id});save();
  await value(service.from('promotion_products').insert(lines.map(index=>({promotion_id:p.id,product_id:report.products[index].id,quantity:1}))));
 }
 report.prepared=true;save();check('60 synthetic products with valid shared recipes',report.products.length===60);
 console.log(JSON.stringify({prepared:true,tag:report.tag,products:60,supplies:Object.keys(report.supplies).length}));
}else if(['--verify','--resume-payments','--resume-expiry'].includes(mode)){
 const resume=mode!=='--verify';
 let normal={id:report.mainOrder},two={id:report.twoOrder},initialStock=report.initialCardStock;
 if(!resume){
 if(!report.prepared||report.completed)throw Error('Requires prepared fixture and no completed verification');
 const card=report.supplies.tarjeta,promo=kind=>report.promotions.find(p=>p.kind===kind).id;
 const withCard=await http('/api/products/'+report.products[50].id),without=await http('/api/products/'+report.products[51].id);
 scenario('02 Receta con tarjeta habilita, sin tarjeta no habilita');check('server card counts are 1 and 0',withCard.status===200&&withCard.data.product.dedication_card_quantity===1&&without.status===200&&without.data.product.dedication_card_quantity===0);
 scenario('03 Dos tarjetas por unidad');check('server two cards',(await http('/api/products/'+report.products[52].id)).data.product.dedication_card_quantity===2);
 scenario('04 Tarjeta opcional por receta de personalización');check('option count attached to correct customization',(await http('/api/products/'+report.products[53].id)).data.product.customization_options.find(o=>o.id===report.option).dedication_card_quantity===1);
 initialStock=stock(card);report.initialCardStock=initialStock;save();const initialCustomers=Number(sql('SELECT count(*) FROM customers;'));
 scenario('05 Pedido HTTP con tarjeta y texto multilinea');normal=await create([item(50,[d()])],null,true);check('normal order created',normal.status===201&&normal.id);report.mainOrder=normal.id;save();
 scenario('06 Reserva exacta, sin consumo definitivo');check('reserve one card, same physical stock',reserve(card)===1&&stock(card)===initialStock);
 scenario('07 No materializa cliente antes de confirmación');check('guest remains guest',(await order(normal.id)).customer_id===null&&Number(sql('SELECT count(*) FROM customers;'))===initialCustomers);
 scenario('08 Empleado lee texto y firma exactos');const detail=await http(`/api/admin/orders/${normal.id}`,undefined,'employee');check('employee real HTTP snapshot',detail.status===200&&JSON.stringify(detail.data.order.order_items[0].dedications)===JSON.stringify([d()]));
 scenario('09 Seguimiento privado conserva mensaje, sin recibo');const track=await http('/api/orders/track',{order_id:normal.id,customer_phone:'00076251'});check('tracking dedication and no premature receipt',track.status===200&&JSON.stringify(track.data.order.items[0].dedications)===JSON.stringify([d()])&&!track.data.order.receipt_token);
 scenario('10 Producto sin tarjeta compra sin mensaje');const plain=await create([item(51)]);check('without card order',Boolean(plain.id));await cancel(plain.id);
 scenario('11 No tarjeta rechaza dedicatoria manipulada RPC');const countBefore=countOrders();check('no partial invalid order',!(await create([item(51,[d()])])).id&&countOrders()===countBefore);
 scenario('12 HTTP rechaza texto excesivo');check('251 chars HTTP blocked',(await create([item(50,[d('a'.repeat(251))])],null,true)).status===400);
 scenario('13 SQL rechaza texto excesivo');check('251 chars SQL blocked',!(await create([item(50,[d('a'.repeat(251))])])).id);
 scenario('14 SQL rechaza firma excesiva');check('61 signature SQL blocked',!(await create([item(50,[d('Hola','a'.repeat(61))])])).id);
 scenario('15 Máximos exactos 250/60 y caracteres Unicode');const max=await create([item(50,[d('á'.repeat(250),'ñ'.repeat(60))])]);check('exact max accepted',Boolean(max.id));await cancel(max.id);
 scenario('16 Campos vacíos mantienen tarjeta en blanco');const blank=await create([item(50,[d('','')])]);check('blank card accepted',Boolean(blank.id));await cancel(blank.id);
 scenario('17 Dos tarjetas, mensajes distintos');two=await create([item(52,[d('Para mamá','Ana TEST'),d('Para papá','Luis TEST')])]);check('two distinct card snapshots',Boolean(two.id));report.twoOrder=two.id;save();
 scenario('18 Cantidad dos exige dos mensajes explícitos');check('no silent duplication',!(await create([item(50,[d()],2)])).id);const units=await create([item(50,[d('Uno'),d('Dos')],2)]);check('two units accepted',Boolean(units.id));await cancel(units.id);
 scenario('19 Combo conserva dedicatoria solo en su componente');const combo=await create([item(50,[d('Componente con tarjeta')]),item(51)],promo('combo'));check('combo discount and component binding',Boolean(combo.id)&&Number((await order(combo.id)).total)===90&&sql(`SELECT count(*)=1 FROM order_items WHERE order_id='${combo.id}' AND jsonb_array_length(dedications)>0;`)==='t');await cancel(combo.id);
 scenario('20 Tarjeta de opción se reserva sin cargo extra');const customized=await create([{...item(53,[d()]),customization_option_ids:[report.option]}]);check('customization card contract',Boolean(customized.id)&&Number((await order(customized.id)).total)===40);await cancel(customized.id);
 scenario('21 Cambio de receta bloquea texto obsoleto sin perder pedidos previos');await value(service.from('product_inventory_requirements').delete().eq('product_id',report.products[50].id).eq('inventory_item_id',card));
 check('stale card selection rejected',!(await create([item(50,[d()])])).id);check('stored dedication remains unchanged',(await http(`/api/admin/orders/${normal.id}`,undefined,'employee')).data.order.order_items[0].dedications[0].message===d().message);
 await value(service.from('product_inventory_requirements').insert({product_id:report.products[50].id,inventory_item_id:card,quantity:1}));
 scenario('22 Doble submit simultáneo idempotente con dedicatoria');const key=randomUUID(),same=await Promise.all([create([item(50,[d('Idempotente')])],null,false,'retiro',key),create([item(50,[d('Idempotente')])],null,false,'retiro',key)]);check('same key one order',same[0].id&&same[0].id===same[1].id);await cancel(same[0].id);
 scenario('23 Misma clave y dedicatoria diferente rechazada');check('contract includes dedicated text',!(await create([item(50,[d('Diferente')])],null,false,'retiro',key)).id);
 }
 const card=report.supplies.tarjeta,promo=kind=>report.promotions.find(p=>p.kind===kind).id;
 if(resume && initialStock===undefined){if((await order(normal.id)).status!=='pendiente_pago')throw Error('Unsafe resume');initialStock=stock(card);report.initialCardStock=initialStock;save();}
 if(mode!=='--resume-expiry'){
 scenario('24 QR1 reporta, no confirma');const paid=await pay(normal.id,'qr_1');check('QR1 pending only',paid.status===200&&paid.data.payment.status==='pendiente'&&(await order(normal.id)).status==='pendiente_pago');
 scenario('25 QR2 reporta, no confirma');const paidTwo=await pay(two.id,'qr_2');check('QR2 pending only',paidTwo.status===200&&paidTwo.data.payment.status==='pendiente');
 scenario('26 Doble aviso reutiliza pago');const again=await pay(normal.id,'qr_1');check('one pending payment',again.status===200&&again.data.payment.id===paid.data.payment.id&&Number(sql(`SELECT count(*) FROM payments WHERE order_id='${normal.id}';`))===1);
 scenario('27 Confirmación manual consume tarjeta una sola vez');check('admin confirms',(await http(`/api/admin/payments/${paid.data.payment.id}/confirm`,{},'admin')).status===200);check('one card consumed once',stock(card)===initialStock-1&&(await order(normal.id)).status==='confirmado');
 check('duplicate confirm rejected',(await http(`/api/admin/payments/${paid.data.payment.id}/confirm`,{},'admin')).status===400);
 scenario('28 Rechazo libera dos tarjetas sin reponer físicamente');const beforeReject=stock(card);check('reject pending',(await http(`/api/admin/payments/${paidTwo.data.payment.id}/reject`,{reason:report.tag},'admin')).status===200&&stock(card)===beforeReject);
 scenario('29 Recibo solo después de confirmación');check('tracking has receipt after confirmation',Boolean((await http('/api/orders/track',{order_id:normal.id,customer_phone:'00076251'})).data.order.receipt_token));
 scenario('30 Promoción porcentaje sin alterar tarjeta');const percentage=await create([item(50,[d()])],promo('percentage'));check('ten percent yields Bs49.50',percentage.id&&Number((await order(percentage.id)).total)===49.5);await cancel(percentage.id);
 scenario('31 Mínimo de compra');check('minimum not met blocks order',!(await create([item(50,[d()])],promo('minimum'))).id);
 scenario('32 Pedido gratuito sin QR ni pago');const free=await create([item(50,[d()])],promo('free'));check('zero total auto-confirmed without payment',free.id&&Number((await order(free.id)).total)===0&&(await order(free.id)).status==='confirmado'&&Number(sql(`SELECT count(*) FROM payments WHERE order_id='${free.id}';`))===0);
 scenario('33 Entrega habilitada y recojo');const setting=await value(service.from('system_settings').select('value').eq('key','delivery_enabled').single());
 try{
  await value(service.from('system_settings').update({value:{enabled:true}}).eq('key','delivery_enabled'));const delivered=await create([item(51)],null,true,'entrega');check('delivery can create',Boolean(delivered.id));await cancel(delivered.id);
  scenario('34 Entrega pausada bloquea nuevas entregas y permite recojo');await value(service.from('system_settings').update({value:{enabled:false}}).eq('key','delivery_enabled'));
  check('disabled delivery HTTP blocked',(await create([item(51)],null,true,'entrega')).status===409);check('disabled delivery RPC blocked',!(await create([item(51)],null,false,'entrega')).id);const pickup=await create([item(51)]);check('pickup works',Boolean(pickup.id));await cancel(pickup.id);
 }finally{await value(service.from('system_settings').update({value:setting.value}).eq('key','delivery_enabled'));}
 scenario('35 Merma agota tarjetas, no peluches sin tarjeta');check('no open card reserves before waste',reserve(card)===0);const all=stock(card);
 check('real waste succeeds',(await http('/api/admin/inventory/waste',{inventory_item_id:card,quantity:all,reason:report.tag},'admin')).status===201);
 const a=await http('/api/products/'+report.products[50].id),b=await http('/api/products/'+report.products[51].id);check('card-only sellability affected',!a.data.product.is_available&&b.data.product.is_available);
 scenario('36 Reposición recupera capacidad');check('real restock',(await entry(card,4000)).status===201&&(await http('/api/products/'+report.products[50].id)).data.product.is_available);
 scenario('37 Última unidad y reserva excluyente');const paper=report.supplies.papel,freePaper=stock(paper)-reserve(paper);check('paper waste to one',(await http('/api/admin/inventory/waste',{inventory_item_id:paper,quantity:freePaper-1,reason:report.tag},'admin')).status===201);
 const last=await create([item(59)]);check('last unit reserved',Boolean(last.id)&&!(await create([item(59)])).id);await cancel(last.id);await entry(paper,4000);
 }
 scenario('38 Expiración libera reserva sin consumir tarjeta');const exp=mode==='--resume-expiry'?{id:report.orders.at(-1)}:await create([item(50,[d()])]);await value(service.from('orders').update({reserved_until:'2000-01-01T00:00:00Z'}).eq('id',exp.id));await value(service.from('inventory_reservations').update({expires_at:'2000-01-01T00:00:00Z'}).eq('order_id',exp.id));await value(service.rpc('release_expired_reservations',{p_inventory_item_id:card}));check('expired no card reservation',Number(sql(`SELECT count(*) FROM inventory_reservations WHERE order_id='${exp.id}' AND status='reserved';`))===0);
 scenario('39 Estados operativos conservan dedicatoria');for(const new_status of ['en_preparacion','listo','finalizado'])check('advance '+new_status,(await http(`/api/admin/orders/${normal.id}/status`,{new_status},'employee')).status===200);
 scenario('40 Reintegro parcial y total sobre pago confirmado');const partial=await http(`/api/admin/orders/${normal.id}/returns`,{type:'reintegro',amount:15,reason:report.tag,idempotency_key:randomUUID()},'admin');check('partial refund 15',partial.status===201);const total=await http(`/api/admin/orders/${normal.id}/returns`,{type:'reintegro',amount:40,reason:report.tag,idempotency_key:randomUUID()},'admin');check('remaining refund 40',total.status===201);
 scenario('41 Retorno físico separado sin duplicar dinero');const physical=await http(`/api/admin/orders/${normal.id}/returns`,{type:'retorno_fisico',amount:0,reason:report.tag,idempotency_key:randomUUID()},'admin');check('physical return audited',physical.status===201);
 scenario('42 Venta física y devolución con caja');const sessions=await http('/api/admin/cash-sessions?status=abierta',undefined,'admin');if(!sessions.data.sessions?.length){const registers=await http('/api/admin/cash-registers',undefined,'admin');check('open LOCAL cash',(await http('/api/admin/cash-sessions',{cash_register_id:registers.data.registers[0].id,opening_amount:0},'admin')).status===201);}
 const sale=await http('/api/admin/sales',{items:[{product_id:report.products[51].id,quantity:1}],payment_method:'efectivo'},'admin');check('physical sale final',sale.status===201);report.orders.push(sale.data.sale.id);save();
 const returned=await http(`/api/admin/orders/${sale.data.sale.id}/returns`,{type:'devolucion',amount:50,reason:report.tag,idempotency_key:randomUUID()},'admin');check('physical sale refund',returned.status===201);
 scenario('43 Reportes ventas, caja, productos, inventario y mermas');const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/La_Paz',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const type of ['sales','cash','products-sold','inventory','waste']){const r=await http(`/api/admin/reports/${type}?from=${date}&to=${date}`,undefined,'admin');check('real report '+type,r.status===200);if(type==='sales')report.salesSummary=r.data.summary;}
 const totals=JSON.parse(sql(`SELECT jsonb_build_object('gross',coalesce(sum(amount) FILTER(WHERE kind='sale'),0),'refunds',coalesce(sum(amount) FILTER(WHERE kind='refund'),0)) FROM sales_ledger WHERE occurred_at>= '${date}T00:00:00-04:00' AND occurred_at<='${date}T23:59:59.999999-04:00';`));
 check('sales report cents reconcile to real ledger',Math.round(report.salesSummary.gross_sales*100)===Math.round(totals.gross*100)&&Math.round(report.salesSummary.refunds*100)===Math.round(totals.refunds*100));
 scenario('44 Carritos reales de 1/5/10/20/30 líneas vía servidor');for(const size of [1,5,10,20,30]){const lines=report.products.slice(0,size).map(p=>({product_id:p.id,quantity:1,...(p.cards?{dedications:Array.from({length:p.cards},()=>d('Texto largo '.repeat(20)))}:{})}));const created=await create(lines);check('real order '+size+' lines',created.id&&Number(sql(`SELECT count(*) FROM order_items WHERE order_id='${created.id}';`))===size);await cancel(created.id);}
 scenario('45 Conciliación de stock, lotes y reservas de todos los nuevos insumos');for(const id of Object.values(report.supplies))check('reconcile '+id.slice(0,8),sql(`SELECT i.current_stock>=0 AND i.current_stock=coalesce((SELECT sum(remaining_quantity) FROM inventory_lots WHERE inventory_item_id=i.id),0) AND i.current_stock>=coalesce((SELECT sum(quantity) FROM inventory_reservations WHERE inventory_item_id=i.id AND status='reserved' AND expires_at>clock_timestamp()),0) FROM inventory_items i WHERE i.id='${id}';`)==='t');
 // Original records are immutable evidence; append-only operations above target new fixtures only.
 for(const table of tables){const baseline=report.originals[table];const idSet=new Set(baseline.ids);const preserved=rows(table).filter(row=>idSet.has(row.id));check('original '+table+' preserved',preserved.length===baseline.count&&hash(preserved)===baseline.sha256);}
 report.completed=true;report.completedAt=new Date().toISOString();save();
 console.log(JSON.stringify({scenarios:report.scenarios.length,checks:report.checks.length,passed:report.checks.filter(c=>c.pass).length,orders:report.orders.length,payments:report.payments.length,syntheticProducts:report.products.length}));
}else throw Error('Only --prepare or --verify');
