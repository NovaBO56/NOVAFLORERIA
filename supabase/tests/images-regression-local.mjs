// Real local uploads; temporary CHECK injects one DB failure for a synthetic product.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),lab=process.env.NOVA_LOCAL_LAB;
if(!lab||path.basename(lab)!=='NOVA-LOCAL-VALIDATION'||fs.existsSync(path.join(lab,'supabase/.temp/project-ref')))throw Error('Unlinked LOCAL lab only');
const config=JSON.parse(fs.readFileSync(path.join(lab,'.env-local-status.private.json'),'utf8').replace(/^\uFEFF/,''));
const http=process.env.NOVA_LOCAL_HTTP||'http://127.0.0.1:3110';
if(config.API_URL!=='http://127.0.0.1:55421'||!/^http:\/\/127\.0\.0\.1:\d+$/.test(http))throw Error('Localhost only');
const require=createRequire(new URL('../../package.json',import.meta.url)),sharp=require('sharp'),{createServerClient}=require('@supabase/ssr');
const cases=[],fixtures=[],errors=[],label='TEST IMAGE REGRESSION '+crypto.randomUUID().slice(0,8),constraint='test_image_fault_'+crypto.randomBytes(4).toString('hex');
let cookie='',fault=false;
const sql=async text=>(await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-v','ON_ERROR_STOP=1','-At','-c',text])).stdout.trim();
function check(name,value){cases.push({name,passed:!!value});console.log(name,value?'PASS':'FAIL');if(!value)throw Error(name);}
async function api(route,body){const response=await fetch(http+route,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
async function upload(id,bytes,mime,name){const form=new FormData();form.append('file',new Blob([bytes],{type:mime}),name);return api(`/api/admin/products/${id}/images`,form);}
try{
 const credentials=JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA,'NOVA-Floreria/local-test/admin-pruebas.credentials.private.json'),'utf8'));
 if(credentials.supabase_url!==config.API_URL)throw Error('Credentials target mismatch');
 const jar=new Map(),client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
 const login=await client.auth.signInWithPassword({email:credentials.email,password:credentials.password});if(login.error)throw login.error;cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');
 const product=(await api('/api/admin/products',{name:label,price:10})).data.product.id;fixtures.push({table:'products',id:product});
 for(const [format,mime] of [['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp']]){
  const bytes=await sharp({create:{width:2000,height:1000,channels:3,background:'purple'}})[format]().toBuffer();
  const result=await upload(product,bytes,mime,'test.'+format);check(format+' real upload',result.status===201);fixtures.push({table:'product_images',id:result.data.image.id});
  const image=result.data.image;check(format+' optimized dimensions',image.mime_type==='image/webp'&&image.width===1600&&image.height===800&&image.storage_path.endsWith('.webp'));
  if(!image.public_url.startsWith(config.API_URL+'/storage/v1/object/public/'))throw Error('Unexpected storage destination');
  const response=await fetch(image.public_url),stored=Buffer.from(await response.arrayBuffer());const metadata=await sharp(stored).metadata();check(format+' public image real WebP',response.status===200&&metadata.format==='webp'&&metadata.width===1600);
 }
 const listing=await api('/api/products/'+product);check('public detail contains uploaded images',listing.status===200&&listing.data.product.images.length===3);
 check('oversize rejected',(await upload(product,Buffer.alloc(5*1024*1024+1),'image/png','too-big.png')).status===400);
 check('corrupt rejected',(await upload(product,Buffer.from('corrupt'),'image/png','corrupt.png')).status===400);
 const faultProduct=(await api('/api/admin/products',{name:label+' DB fault',price:10})).data.product.id;fixtures.push({table:'products',id:faultProduct});
 await sql(`ALTER TABLE public.product_images ADD CONSTRAINT ${constraint} CHECK(product_id <> '${faultProduct}'::uuid) NOT VALID`);fault=true;
 const image=await sharp({create:{width:30,height:30,channels:3,background:'white'}}).png().toBuffer();
 check('controlled DB insert failure returns 500',(await upload(faultProduct,image,'image/png','fault.png')).status===500);
 check('DB failure cleans uploaded object',await sql(`SELECT NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='product-images' AND name LIKE 'products/${faultProduct}/%') AND NOT EXISTS(SELECT 1 FROM product_images WHERE product_id='${faultProduct}'::uuid)`)==='t');
 await sql(`ALTER TABLE public.product_images DROP CONSTRAINT ${constraint}`);fault=false;
 const qr=await sharp({create:{width:220,height:220,channels:3,background:'white'}}).png().toBuffer();const form=new FormData();form.append('file',new Blob([qr],{type:'image/png'}),'test-original-qr.png');form.append('account_label',label);
 const saved=await api('/api/admin/payment-qr',form);check('QR original upload',saved.status===201);
 const publicQr=(await api('/api/payment-qr')).data.qr.qr_public_url;if(!publicQr.startsWith(config.API_URL+'/'))throw Error('QR target mismatch');
 check('QR bytes preserved without optimization',Buffer.from(await (await fetch(publicQr)).arrayBuffer()).equals(qr));
}catch(error){errors.push(error.message);console.error('FAIL',error.message);process.exitCode=1;}
finally{
 if(fault){try{await sql(`ALTER TABLE public.product_images DROP CONSTRAINT ${constraint}`);}catch(error){errors.push('FAULT CONSTRAINT CLEANUP FAILED: '+error.message);process.exitCode=1;}}
 fs.mkdirSync(path.join(lab,'certification'),{recursive:true});fs.writeFileSync(path.join(lab,'certification/IMAGES_REGRESSION.private.json'),JSON.stringify({label,cases,fixtures,errors,temporaryConstraintRemoved:!fault||errors.length===0},null,2));console.log('SUMMARY',JSON.stringify({cases:cases.length,passed:cases.filter(c=>c.passed).length,errors}));
}
