/** Fixed isolated LOCAL target only. No deletions; reruns verify instead of overwriting edits. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {categories,seasons,products,materials,included,promotions,productByKey,demoId} from './catalog-demo-data.mjs';
const mode=process.argv[2];
if(!['--prepare','--verify'].includes(mode))throw Error('Use --prepare or --verify; only the fixed disposable LOCAL demo is supported.');
const root=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria','catalogo-demo');
const db='supabase_db_NOVA-LOCAL-CATALOGO-DEMO';
if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='desarrollo-auditoria')throw Error('Wrong branch');
if(fs.existsSync(path.join(root,'supabase/.temp/project-ref'))||!fs.readFileSync(path.join(root,'supabase/config.toml'),'utf8').includes('project_id = "NOVA-LOCAL-CATALOGO-DEMO"'))throw Error('Unlinked DEMO identity required');
const cli='C:\\Users\\carli\\scoop\\shims\\supabase.exe';
// CLI .exe shim on Windows is executable directly. Never print captured status.
const status=JSON.parse(execFileSync(cli,['status','--workdir',root,'-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
if(status.API_URL!=='http://127.0.0.1:50621'||!status.DB_URL.includes('@127.0.0.1:50622/'))throw Error('Unexpected destination');
fs.writeFileSync(path.join(root,'status.private.json'),JSON.stringify(status));
const sql=(query,container=db)=>{try{return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-Atq'],{input:query,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe']}).trim();}catch(error){throw Error(`LOCAL SQL failed: ${String(error.stderr??'').slice(0,800)}`);}};
const q=v=>v==null?'NULL':typeof v==='number'?String(v):typeof v==='boolean'?String(v):`'${String(v).replaceAll("'","''")}'`;
const list=values=>`ARRAY[${values.map(q).join(',')}]::uuid[]`;
const fingerprint=sql("select md5(coalesce(string_agg(id::text||coalesce(encrypted_password,''),',' order by id),'')) from auth.users;",'supabase_db_NOVA-LOCAL-INTEGRITY');
const stateFile=path.join(root,'catalog-demo-state.private.json');
let state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):null;
const productCount=Number(sql('select count(*) from public.products;'));
if(mode==='--prepare'&&!state){
 if(productCount!==0||sql('select count(*) from auth.users;')!=='0')throw Error('New empty demo required; no cleanup attempted.');
 const backupDir=path.join(root,'backups');fs.mkdirSync(backupDir,{recursive:true});
 const backup=execFileSync('docker',['exec','supabase_db_NOVA-LOCAL-INTEGRITY','pg_dump','-U','postgres','-d','postgres','-Fc'],{maxBuffer:512*1024*1024,stdio:['ignore','pipe','pipe']});
 fs.writeFileSync(path.join(backupDir,'integrity-before-demo.private.dump'),backup);
 execFileSync('docker',['exec','-i',db,'pg_restore','--list'],{input:backup,stdio:['pipe','pipe','pipe'],maxBuffer:16*1024*1024});
 const demoBackup=execFileSync('docker',['exec',db,'pg_dump','-U','postgres','-d','postgres','-Fc'],{maxBuffer:128*1024*1024,stdio:['ignore','pipe','pipe']});
 fs.writeFileSync(path.join(backupDir,'empty-demo.private.dump'),demoBackup);
 // Restore only existing Auth accounts/identities/profiles. Password hashes and
 // role assignments are preserved verbatim. No new password or user deletion.
 const accounts=execFileSync('docker',['exec','supabase_db_NOVA-LOCAL-INTEGRITY','pg_dump','-U','postgres','-d','postgres','--data-only','--column-inserts','--no-owner','--no-acl','-t','auth.users','-t','auth.identities','-t','public.profiles'],{encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});
 sql(`BEGIN; SET LOCAL session_replication_role=replica; ${accounts}\n COMMIT;`);
 if(sql("select md5(coalesce(string_agg(id::text||coalesce(encrypted_password,''),',' order by id),'')) from auth.users;")!==fingerprint)throw Error('Auth restore fingerprint mismatch');
 state={version:1,stage:'accounts-restored',anchor:new Date().toISOString(),sourceAccountFingerprint:fingerprint,backupSha256:crypto.createHash('sha256').update(backup).digest('hex'),backupBytes:backup.length};
 fs.writeFileSync(stateFile,JSON.stringify(state,null,2));
 console.log('PASS private DB backup archive readable; existing Auth/password hashes/profiles restored into new DEMO.');
}
if(!state)throw Error('Prepare demo first');
if(mode==='--prepare'&&state.stage==='accounts-restored'){
 if(productCount!==0)throw Error('Unexpected commercial data; no deletion or overwrite performed');
 const actor=sql("select id from profiles where role='administrador' and is_active order by id limit 1;");
 if(!actor)throw Error('Existing active admin needed');
 const source=fs.readFileSync(new URL('./catalog-demo-data.mjs',import.meta.url),'utf8');
 const statements=['BEGIN;',`SELECT set_config('nova.audit_actor',${q(actor)},true);`];
 for(const c of categories)statements.push(`INSERT INTO categories(id,name,description,is_active)VALUES(${q(c.id)},${q(c.name)},'Categoría del catálogo sintético de demostración LOCAL.',true);`);
 for(const name of seasons)statements.push(`INSERT INTO seasons(id,name,description,is_active)VALUES(${q(demoId(`season:${name}`))},${q(name)},'Temporada demostrativa; no altera fechas comerciales productivas.',true);`);
 for(const m of materials){
  statements.push(`INSERT INTO inventory_items(id,name,sku,item_type,unit,minimum_stock,is_dedication_card)VALUES(${q(m.id)},${q(m.name)},${q(`DEMO-${m.key}`)},${q(m.type)},${q(m.unit)},${m.type==='flor'?30:5},${m.key==='tarjeta'});`);
  if(m.stock>0)for(const [lot,fraction,days]of [[1,0.75,12],[2,0.25,5]])statements.push(`INSERT INTO inventory_entries(id,inventory_item_id,quantity,unit_cost,supplier_name,notes,received_at,created_by)VALUES(${q(demoId(`entry:${m.key}:${lot}`))},${q(m.id)},${m.stock*fraction},${m.type==='flor'?4:2},'Proveedor demostrativo de flores y regalos',${q(`DEMO v1 lote ${lot}`)},${q(state.anchor)}::timestamptz-interval '${days} days',${q(actor)});`);
 }
 for(const p of products){
  statements.push(`INSERT INTO products(id,name,description,price,category_id,occasion,season_id,is_active,is_available,is_featured,catalog_order)VALUES(${q(p.id)},${q(p.name)},${q(p.description)},${p.price},${q(p.categoryId)},${q(p.occasion)},${q(demoId(`season:${p.season}`))},false,false,${p.featured},${p.order});`);
  for(const r of p.recipe)statements.push(`INSERT INTO product_inventory_requirements(product_id,inventory_item_id,quantity)VALUES(${q(p.id)},${q(materials.find(m=>m.key===r.key).id)},${r.quantity});`);
 }
 for(const c of included)statements.push(`INSERT INTO product_components(parent_product_id,component_product_id,quantity)VALUES(${q(productByKey(c.parent).id)},${q(productByKey(c.child).id)},1);`);
 for(const p of products)statements.push(`SELECT assert_product_recipe(${q(p.id)}); UPDATE products SET is_active=${p.active},is_available=${p.active} WHERE id=${q(p.id)};`);
 for(const [i,p]of promotions.entries()){
  const starts=p.expired?'-30 days':p.future?'+15 days':'-1 day'; const ends=p.expired?'-1 day':p.future?'+45 days':'+365 days';
  statements.push(`INSERT INTO promotions(id,name,description,promotion_type,discount_type,discount_value,combo_price,minimum_purchase,starts_at,ends_at,is_active)VALUES(${q(demoId(`promotion:${i}`))},${q(p.name)},'Promoción sintética de demostración; importes calculados con precios almacenados.',${q(p.type)},${q(p.discountType)},${q(p.value)},${q(p.comboPrice)},${p.minimum??0},${q(state.anchor)}::timestamptz+interval '${starts}',${q(state.anchor)}::timestamptz+interval '${ends}',true);`);
  for(const key of p.keys)statements.push(`INSERT INTO promotion_products(promotion_id,product_id,quantity)VALUES(${q(demoId(`promotion:${i}`))},${q(productByKey(key).id)},1);`);
 }
 const extras=['peluches:0','chocolates:1','globos:0','peluches:1','globos:1','regalos:4'].map(k=>productByKey(k).id);
 statements.push(`SELECT save_global_product_recommendations(true,'all',${list(extras)},'{}',${list(categories.filter(c=>['peluches','chocolates','globos'].includes(c.key)).map(c=>c.id))},'{}',0,${q(actor)});`);
 // Configure only DEMO business hours; never copy a real business contact or QR.
 statements.push("UPDATE business_hours SET is_closed=false,opens_at='00:00',closes_at='23:59';");
 statements.push('COMMIT;');
 sql(statements.join('\n'));
 state.stage='catalog-loaded';state.catalogSha256=crypto.createHash('sha256').update(source).digest('hex');fs.writeFileSync(stateFile,JSON.stringify(state,null,2));
 console.log('PASS atomic commercial fixture loaded; no historical commercial records copied or deleted.');
}
const service=createClient(status.API_URL,status.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const expectedIds=new Set(products.map(p=>p.id));
const {data:actual,error}=await service.from('products').select('id,name,price,category_id,is_active');if(error)throw Error(error.code);
if(actual.length!==100||actual.some(p=>!expectedIds.has(p.id)))throw Error('Catalog count/identity mismatch');
for(const c of categories)if(actual.filter(p=>p.category_id===c.id).length!==c.count)throw Error(`Distribution mismatch ${c.key}`);
if(sql("select md5(coalesce(string_agg(id::text||coalesce(encrypted_password,''),',' order by id),'')) from auth.users;")!==state.sourceAccountFingerprint)throw Error('Existing account/password hashes changed');
const {data:availability,error:avError}=await service.rpc('get_product_availability',{p_items:products.map(p=>({product_id:p.id})),p_combine:false});if(avError||availability.length!==100)throw Error('Availability failure');
const report={products:actual.length,categories:categories.map(c=>({name:c.name,count:c.count})),seasons:seasons.length,materials:materials.length,entries:Number(sql('select count(*) from inventory_entries;')),recipes:products.length,included:included.length,promotions:promotions.length,combos:promotions.filter(p=>p.type==='combo').length,active:actual.filter(p=>p.is_active).length,available:availability.filter(p=>p.is_available).length,accounts:Number(sql('select count(*) from auth.users;')),profiles:Number(sql('select count(*) from profiles;')),migrations:Number(sql('select count(*) from supabase_migrations.schema_migrations;')),backupBytes:state.backupBytes,backupSha256:state.backupSha256};
for(const p of products)sql(`SELECT assert_product_recipe(${q(p.id)});`);
fs.writeFileSync(path.join(root,'catalog-summary.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
