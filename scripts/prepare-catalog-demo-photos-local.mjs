/** LOCAL Storage uploads only, from individually reviewed stock-photo sources. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import sharp from 'sharp';import {createClient}from'@supabase/supabase-js';
import {products}from'./catalog-demo-data.mjs';import{photoSources}from'./catalog-demo-photos.mjs';
const root=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria','catalogo-demo');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'status.private.json'),'utf8'));
if(cfg.API_URL!=='http://127.0.0.1:50621'||fs.existsSync(path.join(root,'supabase/.temp/project-ref')))throw Error('Fixed unlinked LOCAL demo only');
const client=createClient(cfg.API_URL,cfg.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
// Rejected after inspecting the downloaded files: mismatching presentation,
// no flower on a white-orchid product, visible third-party brand, or set contents.
const rejected={31860717:'Caja con rosas coral, no ramo rosado',33886751:'Descarga 404',1309769:'Orquídea sin flor; no representa la orquídea blanca ofrecida',14275709:'Marca comercial ajena visible',35579570:'El set y su envoltura no corresponden a los componentes configurados'};
const dir=path.join(root,'photos');fs.mkdirSync(dir,{recursive:true});const manifest=[];
for(const s of photoSources){
 const product=products.find(p=>p.photoId===s.id);if(!product)continue;
 if(rejected[s.id]){manifest.push({...s,productId:product.id,status:'pending',reason:rejected[s.id]});continue;}
 const file=path.join(dir,`${s.id}.webp`);
 if(!fs.existsSync(file)){const r=await fetch(s.download,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Source download ${s.id} failed`);const b=await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize({width:1000,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:84}).toBuffer();fs.writeFileSync(file,b);}
 const bytes=fs.readFileSync(file),meta=await sharp(bytes).metadata();
 const variants=[{bytes,sort:0,alt:`${product.name} · fotografía de banco ilustrativa, no elaborada por Anabelle`}];
 if([4331696,15416274,20130986].includes(s.id))variants.push({bytes:await sharp(bytes).resize(650,650,{fit:'cover',position:'centre'}).webp({quality:84}).toBuffer(),sort:1,alt:`Detalle de la misma fotografía ilustrativa de ${product.name}`});
 for(const v of variants){
  const storagePath=`catalog-demo-v1/${product.id}/${s.id}-${v.sort}.webp`;
  const {data:existing,error:readError}=await client.from('product_images').select('id').eq('product_id',product.id).eq('storage_path',storagePath);if(readError)throw Error(readError.code);
  if(!existing.length){const upload=await client.storage.from('product-images').upload(storagePath,v.bytes,{contentType:'image/webp',upsert:false});if(upload.error&&upload.error.statusCode!=='409')throw Error(`LOCAL upload failed ${s.id}`);}
  const download=await client.storage.from('product-images').download(storagePath);if(download.error)throw Error('LOCAL image verification download failed');
  if(crypto.createHash('sha256').update(Buffer.from(await download.data.arrayBuffer())).digest('hex')!==crypto.createHash('sha256').update(v.bytes).digest('hex'))throw Error('LOCAL uploaded photo SHA mismatch');
  if(existing.length)continue;
  const m=await sharp(v.bytes).metadata();const insert=await client.from('product_images').insert({product_id:product.id,storage_path:storagePath,public_url:client.storage.from('product-images').getPublicUrl(storagePath).data.publicUrl,alt_text:v.alt,sort_order:v.sort,mime_type:'image/webp',width:m.width,height:m.height,file_size_bytes:v.bytes.length});if(insert.error)throw Error(insert.error.code);
 }
 manifest.push({...s,productId:product.id,product:product.name,status:'reviewed-uploaded',width:meta.width,height:meta.height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
const withPhotos=manifest.filter(s=>s.status==='reviewed-uploaded');
const missing=products.filter(p=>!withPhotos.some(s=>s.productId===p.id)).map(p=>({id:p.id,name:p.name,reason:manifest.find(s=>s.productId===p.id)?.reason??'Sin fotografía individual representativa con procedencia revisada; fallback neutro.'}));
fs.writeFileSync(path.join(root,'photo-manifest.json'),JSON.stringify({license:'https://www.pexels.com/license/',photos:manifest,missing},null,2));
console.log(`PASS ${withPhotos.length} products with unique reviewed local photos; ${missing.length} retain neutral fallback; uploaded bytes SHA-256 verified.`);
