/** Copy ONLY existing explicitly NO PAGAR placeholders between fixed LOCAL labs. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import sharp from'sharp';import{createClient}from'@supabase/supabase-js';import{demoId}from'./catalog-demo-data.mjs';
const root=path.join(process.env.LOCALAPPDATA,'NOVA-Floreria');
const source=JSON.parse(fs.readFileSync(path.join(root,'inventory-refunds-final-replay/status.private.json'))),target=JSON.parse(fs.readFileSync(path.join(root,'catalogo-demo/status.private.json')));
if(source.API_URL!=='http://127.0.0.1:62621'||target.API_URL!=='http://127.0.0.1:50621'||fs.existsSync(path.join(root,'catalogo-demo/supabase/.temp/project-ref')))throw Error('Fixed LOCAL labs only');
const a=createClient(source.API_URL,source.SERVICE_ROLE_KEY,{auth:{persistSession:false}}),b=createClient(target.API_URL,target.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data,error}=await a.from('payment_qr_config').select('qr_slot,qr_storage_path,account_label').ilike('account_label','NO PAGAR%');if(error)throw Error(error.code);
for(const slot of['qr_1','qr_2']){
 const row=data.find(r=>r.qr_slot===slot&&r.qr_storage_path);if(!row)throw Error('Existing explicit no-payment placeholder missing; no bank data copied');
 const download=await a.storage.from('payment-qr').download(row.qr_storage_path);if(download.error)throw Error('LOCAL placeholder download failed');const bytes=Buffer.from(await download.data.arrayBuffer());const m=await sharp(bytes).metadata();if(m.format!=='png'||bytes.length>5242880)throw Error('Unexpected existing placeholder image');
 const key=`catalog-demo/${slot}.png`,upload=await b.storage.from('payment-qr').upload(key,bytes,{contentType:'image/png',upsert:false});if(upload.error&&upload.error.statusCode!=='409')throw Error('Placeholder upload failed');
 const check=await b.storage.from('payment-qr').download(key);if(check.error||crypto.createHash('sha256').update(Buffer.from(await check.data.arrayBuffer())).digest('hex')!==crypto.createHash('sha256').update(bytes).digest('hex'))throw Error('Placeholder SHA mismatch');
 const insert=await b.from('payment_qr_config').upsert({id:demoId(`payment:${slot}`),qr_slot:slot,qr_storage_path:key,qr_public_url:b.storage.from('payment-qr').getPublicUrl(key).data.publicUrl,account_label:`DEMOSTRACIÓN · ${slot==='qr_1'?'QR 1':'QR 2'} · NO PAGAR`,is_active:true},{onConflict:'id',ignoreDuplicates:true});if(insert.error)throw Error(insert.error.code);
}
console.log('PASS two existing LOCAL NO PAGAR images copied and verified; no bank credentials or WhatsApp number configured.');
