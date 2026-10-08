// Pruebas reales, exclusivamente dentro del laboratorio local autorizado.
import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const lab='C:/Users/carli/OneDrive/Desktop/FLORERIA WEB/NOVA-LOCAL-VALIDATION';
if(process.cwd().replaceAll('\\','/')!==lab)throw Error('Ejecutar solo desde NOVA-LOCAL-VALIDATION');
const run=promisify(execFile);
async function sql(db,s){
 if(!['postgres','nova_delta_037'].includes(db))throw Error('Base no autorizada');
 return (await run('docker',['exec','supabase_db_NOVA-LOCAL-VALIDATION','psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At','-c',s])).stdout.trim();
}
const acl=`SELECT json_build_object('old_exists',to_regprocedure('public.create_payment(uuid)') IS NOT NULL,
 'new_exists',to_regprocedure('public.create_payment(uuid,text)') IS NOT NULL,
 'PUBLIC',EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.oid=to_regprocedure('public.create_payment(uuid,text)') AND a.grantee=0 AND a.privilege_type='EXECUTE'),
 'anon',has_function_privilege('anon','public.create_payment(uuid,text)','EXECUTE'),
 'authenticated',has_function_privilege('authenticated','public.create_payment(uuid,text)','EXECUTE'),
 'service_role',has_function_privilege('service_role','public.create_payment(uuid,text)','EXECUTE'))`;
const report={acl:{},http:[],delta:{},equivalence:{}};
for(const db of ['postgres','nova_delta_037'])report.acl[db]=JSON.parse(await sql(db,acl));
const cfg=JSON.parse(fs.readFileSync('.env-local-status.private.json','utf8').replace(/^\uFEFF/,''));
if(cfg.API_URL!=='http://127.0.0.1:55421')throw Error('API no local');
for(const [name,body,code] of [
 ['Firma antigua ausente en PostgREST',{p_order_id:'00000000-0000-4000-8000-000000000001'},'PGRST202'],
 ['Contrato nuevo denegado a anon',{p_order_id:'00000000-0000-4000-8000-000000000001',p_customer_phone:'70000999'},'42501']]){
 const res=await fetch(cfg.API_URL+'/rest/v1/rpc/create_payment',{method:'POST',headers:{apikey:cfg.ANON_KEY,Authorization:'Bearer '+cfg.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await res.json();report.http.push({name,status:res.status,code:data.code,passed:data.code===code});
}
const fixture=JSON.parse(fs.readFileSync('certification/FINAL_DELTA_VERIFIED.json','utf8'));
const product=fixture.syntheticFixtures.product;
const order=await sql('nova_delta_037',`SELECT public.create_order('TEST NOVA DELTA NORMAL','70000999',NULL,'[{"product_id":"${product}","quantity":1}]'::jsonb,NULL,'TEST-NOVA-PAYMENT-RETIREMENT-NORMAL',NULL)`);
const payment=await sql('nova_delta_037',`BEGIN; SET LOCAL ROLE service_role; SELECT id FROM public.create_payment('${order}','70000999'); COMMIT;`);
const id=payment.split('\n').find(x=>/^[0-9a-f-]{36}$/.test(x));
const repeat=await sql('nova_delta_037',`BEGIN; SET LOCAL ROLE service_role; SELECT id FROM public.create_payment('${order}','70000999'); COMMIT;`);
const admin=await sql('nova_delta_037',"SELECT id FROM profiles WHERE role='administrador' AND is_active LIMIT 1");
await sql('nova_delta_037',`BEGIN; SET LOCAL request.jwt.claim.sub='${admin}'; SET LOCAL request.jwt.claims='{"sub":"${admin}","role":"authenticated"}'; SET LOCAL ROLE authenticated; SELECT public.confirm_payment('${id}'); COMMIT;`);
report.delta=JSON.parse(await sql('nova_delta_037',`SELECT json_build_object('order','${order}','payment','${id}','status',(SELECT status FROM orders WHERE id='${order}'),'paymentStatus',(SELECT status FROM payments WHERE id='${id}'),'payments',(SELECT count(*) FROM payments WHERE order_id='${order}'),'stock',(SELECT current_stock FROM inventory_items WHERE id='${fixture.syntheticFixtures.item}'),'cash',(SELECT count(*) FROM cash_movements WHERE order_id='${order}'))`));
report.delta.reusedPendingPayment=repeat.includes(id);
// Confirmación online no inserta caja en el contrato vigente; venta física sí.
report.delta.passed=report.delta.status==='confirmado'&&report.delta.paymentStatus==='confirmado'&&report.delta.payments===1&&Number(report.delta.stock)===1&&report.delta.reusedPendingPayment&&report.delta.cash===0;
const extra=`SELECT json_build_object(
 'views',(SELECT json_agg(x ORDER BY viewname) FROM (SELECT viewname,definition FROM pg_views WHERE schemaname='public') x),
 'storagePolicies',(SELECT json_agg(x ORDER BY policyname) FROM (SELECT * FROM pg_policies WHERE schemaname='storage') x),
 'authTrigger',(SELECT json_agg(pg_get_triggerdef(oid) ORDER BY tgname) FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND tgname='on_auth_user_created'),
 'buckets',(SELECT json_agg(x ORDER BY id) FROM (SELECT id,name,public,file_size_limit,allowed_mime_types FROM storage.buckets) x))`;
const clean=JSON.parse(await sql('postgres',extra)),delta=JSON.parse(await sql('nova_delta_037',extra));
report.equivalence={additionalDifferences:Object.keys(clean).filter(k=>JSON.stringify(clean[k])!==JSON.stringify(delta[k])),scope:Object.keys(clean)};
report.passed=Object.values(report.acl).every(a=>!a.old_exists&&a.new_exists&&!a.PUBLIC&&!a.anon&&!a.authenticated&&a.service_role)&&report.http.every(t=>t.passed)&&report.delta.passed&&report.equivalence.additionalDifferences.length===0;
fs.writeFileSync('certification/PAYMENT_RETIREMENT_FINAL_TESTS.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
