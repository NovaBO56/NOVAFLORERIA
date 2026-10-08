import fs from 'node:fs';
import crypto from 'node:crypto';
const root='supabase/baseline-candidate';
const read=n=>JSON.parse(fs.readFileSync(`audit-supabase/${n}.json`,'utf8').replace(/^\uFEFF/,''));
const baseline=fs.readFileSync(`${root}/BASELINE_CANDIDATE.sql`,'utf8');
const seed=fs.readFileSync(`${root}/SEED_CANDIDATE.sql`,'utf8');
// Lexer local: separa sentencias de nivel superior sin ejecutar SQL.
function statements(sql){
 let quote='',dollar='',block=0,line=false,depth=0,start=0;const parts=[];
 for(let i=0;i<sql.length;i++){
  const c=sql[i],n=sql[i+1];
  if(line){if(c==='\n')line=false;continue;}
  if(block){if(c==='/'&&n==='*'){block++;i++;}else if(c==='*'&&n==='/'){block--;i++;}continue;}
  if(dollar){if(sql.startsWith(dollar,i)){i+=dollar.length-1;dollar='';}continue;}
  if(quote){if(c===quote){if(n===quote)i++;else quote='';}continue;}
  if(c==='-'&&n==='-'){line=true;i++;continue;}
  if(c==='/'&&n==='*'){block++;i++;continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='$'){const m=sql.slice(i).match(/^\$[a-zA-Z_0-9]*\$/);if(m){dollar=m[0];i+=dollar.length-1;continue;}}
  if(c==='(')depth++;if(c===')')depth--;
  if(depth<0)throw Error('Paréntesis desbalanceados');
  if(c===';'&&depth===0){parts.push(sql.slice(start,i));start=i+1;}
 }
 if(quote||dollar||block||depth)throw Error('Delimitadores sin cerrar');
 if(sql.slice(start).trim())parts.push(sql.slice(start));
 return parts.map(s=>s.replace(/--[^\n]*(?:\n|$)/g,'').trim()).filter(Boolean);
}
const top=statements(baseline), seeds=statements(seed);
const r=read('remote-catalog'), hashes=read('migration-hashes');
const results=[];
function check(name,ok,detail){results.push({name,passed:!!ok,detail});}
const legacyRoot=fs.existsSync('supabase/migrations-legacy')?'supabase/migrations-legacy':'supabase/migrations';
check('originales SHA256 intactos',hashes.length===39&&hashes.every(x=>crypto.createHash('sha256').update(fs.readFileSync(`${legacyRoot}/${x.file}`)).digest('hex')===x.sha256),'39 archivos comparados con auditoría');
const counts={tables:top.filter(s=>/^CREATE TABLE /i.test(s)).length,functions:top.filter(s=>/^CREATE OR REPLACE FUNCTION/i.test(s)).length,constraints:top.filter(s=>/^ALTER TABLE .* ADD CONSTRAINT /i.test(s)).length,policies:top.filter(s=>/^CREATE POLICY/i.test(s)).length,indexes:top.filter(s=>/^CREATE (UNIQUE )?INDEX/i.test(s)).length,triggers:top.filter(s=>/^CREATE (OR REPLACE )?TRIGGER/i.test(s)).length};
check('conteo tablas',counts.tables===35,counts.tables);
check('conteo funciones finales',counts.functions===36,counts.functions);
check('conteo constraints',counts.constraints===161,counts.constraints);
check('conteo políticas',counts.policies===89,counts.policies);
check('sin DML ni destructivos a nivel superior',!top.some(s=>/^(DROP|DELETE|TRUNCATE|UPDATE|INSERT|MERGE|COPY)\b/i.test(s)),'DML dentro de funciones conservado; no se ejecutó');
check('seed solo INSERT, BEGIN y COMMIT',seeds.every(s=>/^(INSERT|BEGIN|COMMIT)\b/i.test(s)),seeds.length);
check('sin recrear promotion_customers',!top.some(s=>/^CREATE TABLE.*promotion_customers/i.test(s)));
check('sin función 035',!top.some(s=>/^CREATE OR REPLACE FUNCTION.*track_order_details/i.test(s)));
check('solo firma siete argumentos de create_order',top.filter(s=>/^CREATE OR REPLACE FUNCTION public\.create_order\(/i.test(s)).length===1&&top.find(s=>/^CREATE OR REPLACE FUNCTION public\.create_order\(/i.test(s))?.includes('p_promotion_id uuid'));
check('bootstrap completo',['profiles','categories','seasons','products','product_images','product_components','system_settings'].every(n=>top.some(s=>s.startsWith(`CREATE TABLE "public"."${n}"`))));
check('todas columnas de tablas representadas',r.columns.filter(c=>c.schema==='public'&&r.tables.some(t=>t.schema==='public'&&t.kind==='r'&&t.name===c.table)).every(c=>top.find(s=>s.startsWith(`CREATE TABLE "public"."${c.table}"`))?.includes(`"${c.name}" ${c.type}`)));
check('helpers mutadores sin EXECUTE clientes',['consume_product_inventory','apply_order_discount','release_expired_reservations'].every(n=>top.filter(s=>s.startsWith(`GRANT EXECUTE ON FUNCTION public."${n}"`)).every(s=>s.endsWith('TO service_role'))));
check('sin TRUNCATE/TRIGGER/REFERENCES a clientes',!top.some(s=>/^GRANT (TRUNCATE|TRIGGER|REFERENCES)\b/.test(s)&&/TO "?(anon|authenticated|PUBLIC)"?\b/.test(s)));
check('sin cambios a historial',!top.some(s=>/^(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP).*supabase_migrations/i.test(s)));
check('identidad sin secuencia duplicada',!top.some(s=>/^CREATE SEQUENCE .*rate_limit_attempts_id_seq/.test(s))&&baseline.includes('GENERATED ALWAYS AS IDENTITY'));
check('sin datos de negocio en seed',!seeds.some(s=>/^INSERT INTO public\.(profiles|customers|orders|payments|products|promotions)\b/i.test(s)));
check('ACL explícita por función',top.filter(s=>/^REVOKE ALL ON FUNCTION/i.test(s)).length===counts.functions);
const failed=results.filter(x=>!x.passed);
const report={type:'static-only',postgres_compilation:'not-run',local_replay:'Ver NOVA-LOCAL-VALIDATION/certification/CERTIFICATION_037.md; este verificador solo inspecciona SQL',counts,checks:results,files:['BASELINE_CANDIDATE.sql','SEED_CANDIDATE.sql','SECURITY_REVIEW.md','DRIFT_DECISIONS.md','BASELINE_PLAN.md'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(`${root}/${file}`)).digest('hex')})),passed:failed.length===0};
fs.writeFileSync(`${root}/STATIC_VALIDATION.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,counts,checks:results.length,failed},null,2));
if(failed.length)process.exitCode=1;
