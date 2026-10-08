import fs from 'node:fs';
import crypto from 'node:crypto';
const sourceRoot='supabase/baseline-candidate';
const root=process.argv[2] || sourceRoot;
fs.mkdirSync(root,{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(`audit-supabase/${n}.json`,'utf8').replace(/^\uFEFF/,''));
const r=read('remote-catalog'), a=read('migration-analysis');
const q=s=>'"'+s.replaceAll('"','""')+'"';
const id=(s,n)=>q(s)+'.'+q(n);
const sql=s=>s.trim().replace(/;$/,'')+';';
const write=(n,s)=>fs.writeFileSync(`${root}/${n}`,s+'\n');
const functions=r.functions.filter(f=>f.schema==='public'&&f.name!=='rls_auto_enable'&&!(f.name==='create_order'&&f.identity.split(',').length===6)&&!(f.name==='create_payment'&&f.identity.split(',').length===1));
const selected=new Map(functions.map(f=>[f,f.name==='confirm_payment'?a.functionComparison.find(x=>x.remote_name==='confirm_payment').expected_statement:f.definition]));
for(const [name,file] of [['confirm_payment','CONFIRM_PAYMENT_FINAL.sql'],['handle_new_user','HANDLE_NEW_USER_FINAL.sql']]) {
 if(fs.existsSync(`${sourceRoot}/${file}`)) selected.set(functions.find(f=>f.name===name),fs.readFileSync(`${sourceRoot}/${file}`,'utf8'));
}
if(fs.existsSync(`${sourceRoot}/CREATE_PAYMENT_FINAL.sql`)) {
 const f={...r.functions.find(f=>f.schema==='public'&&f.name==='create_payment'),identity:'p_order_id uuid, p_customer_phone text',definition:fs.readFileSync(`${sourceRoot}/CREATE_PAYMENT_FINAL.sql`,'utf8')};
 functions.push(f);selected.set(f,f.definition);
}
const publicNames=new Set(['is_active_user','is_admin','is_employee_or_admin','get_business_status','track_order','create_order','create_payment','check_rate_limit']);
if(fs.existsSync(`${sourceRoot}/BACKEND_FINAL_DEFINITIONS.json`)) {
 for(const override of JSON.parse(fs.readFileSync(`${sourceRoot}/BACKEND_FINAL_DEFINITIONS.json`,'utf8'))) {
  const identity=override.sql.match(/FUNCTION public\.\w+\(([^)]*)\)/i)[1];
  let f=functions.find(f=>f.name===override.name&&f.identity.split(',').filter(Boolean).length===identity.split(',').filter(Boolean).length);
  if(!f) { f={schema:'public',name:override.name,identity,result:['protect_order_request_contract','validate_inventory_movement_actor'].includes(override.name)?'trigger':'void',definition:override.sql,security_definer:true};functions.push(f); }
  selected.set(f,override.sql);
 }
}
const internalNames=new Set(['consume_product_inventory','consume_order_reservations','protect_order_request_contract','apply_order_discount','release_expired_reservations','handle_new_user','create_payment']);
const mode=f=>f.result==='trigger'||internalNames.has(f.name)?'internal':publicNames.has(f.name)?'public':'staff';
const signature=f=>`public.${q(f.name)}(${f.identity?f.identity.split(',').map(arg=>arg.trim().replace(/^\w+\s+/, '')).join(', '):''})`;
const tables=r.tables.filter(t=>t.schema==='public'&&t.kind==='r').sort((x,y)=>x.name.localeCompare(y.name));
const lines=[`-- NOVA FLORERÍA: CANDIDATA, NO APROBADA NI EJECUTADA.
-- Solo para una instancia Supabase NUEVA con auth/storage y roles provisionados.
-- No ejecutar en el proyecto vinculado. No es un dump ni una reconciliación.
-- Decisiones propuestas: DRIFT_DECISIONS.md y SECURITY_REVIEW.md.
-- Sin filas reales, historial, valores actuales de secuencias ni migración 035.
BEGIN;
SET LOCAL search_path = public, extensions, pg_catalog;
SET LOCAL check_function_bodies = off;
DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Ejecutar únicamente como postgres en instancia nueva aislada.';
  END IF;
  IF to_regclass('auth.users') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE EXCEPTION 'Requiere plataforma Supabase provisionada (auth/storage).';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')) THEN
    RAISE EXCEPTION 'public debe estar vacío: esta candidata no se aplica sobre una base existente.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created' AND tgrelid='auth.users'::regclass) THEN
    RAISE EXCEPTION 'Integración Auth existente: revisar antes de continuar.';
  END IF;
END;
$guard$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
-- plpgsql, auth.uid(), roles y tablas de Storage/Auth son prerrequisitos de Supabase.
-- No recrear esquemas internos, event triggers de plataforma, pg_stat_statements o Vault.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
`];
for(const s of r.sequences.filter(s=>s.schema==='public'&&s.name!=='rate_limit_attempts_id_seq')) lines.push(`CREATE SEQUENCE ${id(s.schema,s.name)} AS ${s.type} INCREMENT BY ${s.increment} MINVALUE ${s.min} MAXVALUE ${s.max} START WITH ${s.start} ${s.cycle?'CYCLE':'NO CYCLE'};`);
for(const t of tables){
 const cols=r.columns.filter(c=>c.schema==='public'&&c.table===t.name).sort((x,y)=>x.position-y.position);
 lines.push(`CREATE TABLE ${id('public',t.name)} (\n${cols.map(c=>'  '+q(c.name)+' '+c.type+(c.identity?` GENERATED ${c.identity==='a'?'ALWAYS':'BY DEFAULT'} AS IDENTITY`:c.generated?` GENERATED ALWAYS AS (${c.default}) STORED`:c.default?' DEFAULT '+c.default:'')+(c.not_null?' NOT NULL':'')).join(',\n')}\n);`);
}
if(fs.existsSync(`${sourceRoot}/BACKEND_SCHEMA_FINAL.sql`))lines.push(fs.readFileSync(`${sourceRoot}/BACKEND_SCHEMA_FINAL.sql`,'utf8').trim());
for(const v of r.views.filter(v=>v.schema==='public'))lines.push(`-- La vista define un tipo de fila requerido por get_audit_trail; crear antes de funciones.\nCREATE VIEW ${id(v.schema,v.name)} AS\n${sql(v.definition)}`);
for(const [f,definition] of selected) lines.push(`-- ${f.name}: ${f.name==='confirm_payment'?'fuente local 013, propuesta':'catálogo auditado'}\n${sql(definition)}`);
const constraints=r.constraints.filter(c=>c.schema==='public').sort((x,y)=>(x.type==='f')-(y.type==='f'));
for(const c of constraints) lines.push(`ALTER TABLE ${id('public',c.table)} ADD CONSTRAINT ${q(c.name)} ${c.definition}${!c.validated&&!/NOT VALID/i.test(c.definition)?' NOT VALID':''};`);
const constraintNames=new Set(constraints.filter(c=>['p','u','x'].includes(c.type)).map(c=>c.name));
for(const i of r.indexes.filter(i=>i.schemaname==='public'&&!constraintNames.has(i.indexname)))lines.push(sql(i.indexdef));
for(const t of tables){if(t.rls)lines.push(`ALTER TABLE ${id('public',t.name)} ENABLE ROW LEVEL SECURITY;`);if(t.force_rls)lines.push(`ALTER TABLE ${id('public',t.name)} FORCE ROW LEVEL SECURITY;`);}
for(const p of r.policies.filter(p=>p.schemaname==='public'||p.schemaname==='storage'))lines.push(`CREATE POLICY ${q(p.policyname)} ON ${id(p.schemaname,p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(n=>n==='public'?'PUBLIC':q(n)).join(', ')}${p.qual?' USING ('+p.qual+')':''}${p.with_check?' WITH CHECK ('+p.with_check+')':''};`);
for(const t of r.triggers.filter(t=>t.schema==='public'||(t.schema==='auth'&&t.name==='on_auth_user_created'))){lines.push(sql(t.definition.replace('FUNCTION handle_new_user()', 'FUNCTION public.handle_new_user()')));if(t.enabled==='D')lines.push(`ALTER TABLE ${id(t.schema,t.table)} DISABLE TRIGGER ${q(t.name)};`);}
if(fs.existsSync(`${sourceRoot}/BACKEND_TRIGGER_FINAL.sql`))lines.push(fs.readFileSync(`${sourceRoot}/BACKEND_TRIGGER_FINAL.sql`,'utf8').trim());
lines.push('-- ACL de tablas/vista: conservar accesos auditados; RLS determina acceso a filas.');
for(const t of [...tables,...r.tables.filter(t=>t.schema==='public'&&t.kind==='v')]){
 lines.push(`REVOKE ALL ON TABLE ${id('public',t.name)} FROM PUBLIC, anon, authenticated, service_role;`);
 const grants=r.table_grants.filter(g=>g.table_schema==='public'&&g.table_name===t.name&&['anon','authenticated','service_role','PUBLIC'].includes(g.grantee));
 for(const g of grants) if(['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'].includes(g.privilege_type)&&(!['anon','authenticated','PUBLIC'].includes(g.grantee)||['SELECT','INSERT','UPDATE','DELETE'].includes(g.privilege_type)))lines.push(`GRANT ${g.privilege_type} ON TABLE ${id('public',t.name)} TO ${g.grantee==='PUBLIC'?'PUBLIC':q(g.grantee)}${g.is_grantable==='YES'?' WITH GRANT OPTION':''};`);
}
lines.push('-- Propuesta: no conceder TRUNCATE/TRIGGER/REFERENCES a clientes; TRUNCATE no queda protegido por RLS. service_role conserva privilegios auditados.');
for(const s of r.sequences.filter(s=>s.schema==='public'))lines.push(`REVOKE ALL ON SEQUENCE ${id('public',s.name)} FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE ${id('public',s.name)} TO service_role;`);
lines.push('-- ACL RPC PROPUESTA: revocar PUBLIC evita EXECUTE heredado. Los helpers internos siguen funcionando bajo el propietario de los RPC SECURITY DEFINER.');
for(const f of functions){const sig=signature(f);lines.push(`ALTER FUNCTION ${sig} OWNER TO postgres;\nREVOKE ALL ON FUNCTION ${sig} FROM PUBLIC, anon, authenticated, service_role;`);if(f.name!=='create_payment'||f.identity.split(',').length===2)lines.push(`GRANT EXECUTE ON FUNCTION ${sig} TO ${mode(f)==='public'?'anon, authenticated, service_role':mode(f)==='staff'?'authenticated, service_role':'service_role'};`);}
lines.push(`-- Verificación defensiva de exclusiones, sin cambios de historial.
DO $verify$
BEGIN
  IF to_regclass('public.promotion_customers') IS NOT NULL
     OR to_regprocedure('public.create_order(text,text,text,jsonb,text,text)') IS NOT NULL
     OR to_regprocedure('public.track_order_details(text,bigint,uuid)') IS NOT NULL
     OR to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Objeto expresamente excluido de la baseline.';
  END IF;
END;
$verify$;
COMMIT;`);
write('BASELINE_CANDIDATE.sql',lines.join('\n\n'));
write('SEED_CANDIDATE.sql',`-- CANDIDATA: solo nueva instancia después de BASELINE_CANDIDATE.sql.
-- Defaults de instalación, sin clientes, usuarios, productos o configuraciones privadas.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
       ('payment-qr', 'payment-qr', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- No sube archivos. Límites de payment-qr propuestos: no copiar ausencia de límites remota.
INSERT INTO public.cash_registers (name, is_active)
SELECT 'Caja principal', true WHERE NOT EXISTS (SELECT 1 FROM public.cash_registers);
-- Caja sin sesión abierta, saldo o movimientos; la apertura corresponde al operador.
INSERT INTO public.business_hours (day_of_week, opens_at, closes_at, is_closed)
SELECT d::smallint, NULL::time, NULL::time, true FROM generate_series(0,6) d
ON CONFLICT (day_of_week) DO NOTHING;
-- Cerrado por defecto hasta que el administrador defina su horario real.
INSERT INTO public.system_settings (key, value, is_critical)
VALUES ('accept_orders_outside_hours', '{"enabled":false}'::jsonb, true)
ON CONFLICT (key) DO NOTHING;
-- QR/WhatsApp: no insertar filas ni valores ficticios. Configurar mediante panel existente.
COMMIT;`);
const files=[];const walk=dir=>{for(const x of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+x.name;if(x.isDirectory())walk(p);else if(/\.(tsx?|jsx?)$/.test(x.name))files.push(p);}};walk('src');
const sources=files.map(p=>[p,fs.readFileSync(p,'utf8')]);
const routes=f=>sources.filter(([,s])=>new RegExp(`\\.rpc\\(\\s*["']${f.name}["']`).test(s)).map(([p])=>p);
const calls=f=>functions.filter(x=>x!==f&&new RegExp(`\\b${f.name}\\s*\\(`).test(selected.get(x))).map(x=>x.name);
const driftNames=['release_expired_reservations','confirm_payment','create_physical_sale','advance_order_status','create_order'];
const rec={release_expired_reservations:'Adoptar cuerpo remoto: libera reservas vencidas y cancela sus pedidos pendientes. Restricción de EXECUTE a helper interno. Pendiente probar cancelaciones parciales y rollback si un llamador falla.',confirm_payment:'Adoptar cuerpo local 013: rechaza reservas vencidas/liberadas sin afirmar una cancelación persistida. La versión remota actualiza cancelación y después RAISE, por lo que el RPC abortado revierte sus cambios. Cancelación automática persistente requiere otro contrato/transacción y aprobación; no se inventa ese contrato aquí.',create_physical_sale:'Adoptar cuerpo remoto: venta física finalizada, no entra al flujo de preparación; habilita devoluciones que exigen finalizado. El pago continúa confirmado. Validar reportes y caja.',advance_order_status:'Versionar cuerpo remoto ausente en migrations: empleado/admin, bloqueo de pedido y transición secuencial confirmado → en_preparacion → listo → finalizado.',create_order:'Siete argumentos: adoptar 031/cuerpo remoto coincidente; Next.js envía p_promotion_id. Seis argumentos: retirar en una instalación nueva por omisión; no ejecutar DROP remoto. La antigua omite controles de horario/opciones de 031 y no se usa directamente en src.'};
let drift=`# Decisiones de drift propuestas\n\nNinguna decisión tiene aprobación del usuario todavía. Se muestran definiciones completas de las seis firmas antes de cualquier ejecución. La candidata expresa las recomendaciones siguientes; no es estado remoto aplicado. Fuentes: snapshot auditado y 39 archivos intactos.\n\n`;
for(const f of r.functions.filter(f=>f.schema==='public'&&driftNames.includes(f.name))){const x=a.functionComparison.find(x=>x.remote_definition===f.definition);const six=f.name==='create_order'&&f.identity.split(',').length===6;drift+=`## ${f.name}(${f.identity})\n\nFuente local final: ${x?.final_source??'ausente en proyección final'}. ${six?'025 retira esta firma; el cuerpo histórico 020 se muestra como referencia, no como definición local final.':''}\n\n### Local final\n\n${x?.expected_statement?'```sql\n'+sql(x.expected_statement)+'\n```':'No existe definición final en migrations. '+(six?'La firma fue retirada.':'Tampoco existe en MASTER según auditoría.')}\n\n### Remota auditada\n\n\`\`\`sql\n${sql(f.definition)}\n\`\`\`\n\n### Diferencia, consumo y recomendación\n\n${rec[f.name]}\n\nNext.js: ${routes(f).join(', ')||'sin llamada RPC directa'}. ${six?'La ruta de pedidos usa siete parámetros, no esta firma.':f.name==='release_expired_reservations'?'Uso indirecto desde create_order y create_physical_sale.':''}\n\nSelección en candidata: ${six?'excluida':f.name==='confirm_payment'?'local 013':'remota auditada'}. Pendiente aprobación y replay local.\n\n`;}
drift='> Decisiones técnicas cerradas y definición oficial completa: SECURITY_DECISIONS_FINAL.md. La confirmación se deriva de 013 y agrega validaciones de pedido/monto/reserva y orden uniforme de bloqueos; la selección original 013 sin esas guardias queda superada. No hay aprobación de ejecución remota.\n\n'+drift;
write('DRIFT_DECISIONS.md',drift);
let sec=`# Revisión de SECURITY DEFINER\n\nSolo análisis local. No se probaron mutaciones ni se cambiaron permisos remotos. El snapshot otorga EXECUTE efectivo a anon, authenticated y service_role para las 35 funciones public, además de PUBLIC en sus ACL. El cliente Next.js usa clave anon con sesión por cookies: en admin ejecuta con JWT authenticated, no service_role. Revocar PUBLIC es necesario para que revocar anon sea efectivo.\n\nLos grants de BASELINE_CANDIDATE.sql son propuestas solo para la instalación nueva. No hay script de endurecimiento remoto. Tablas/políticas se conservan del snapshot; los grants amplios protegidos por RLS aún requieren pruebas por rol.\n\n`;
for(const f of r.functions.filter(f=>f.schema==='public')){
 const body=f.definition||'';const role=/public\.is_admin\s*\(/.test(body)?'Comprueba is_admin (usuario activo).':/public\.is_employee_or_admin\s*\(/.test(body)?'Comprueba is_employee_or_admin (usuario activo).':/^is_/.test(f.name)?'Consulta perfil de auth.uid(); no acepta una identidad ajena.':/auth\.uid\s*\(/.test(body)?'Usa auth.uid(); revisar el contexto completo: registrar actor no equivale a autorización.':'No valida rol/identidad del llamador.';
 const m=mode(f);sec+=`## ${f.name}(${f.identity})\n\n- Ejecutores remotos efectivos: anon / authenticated / service_role; SECURITY DEFINER, propietario ${f.owner}; ${JSON.stringify(f.config)}.\n- Identidad/rol: ${role}\n- Tipo: ${f.result==='trigger'?'trigger; no RPC ordinario invocable por PostgREST':f.result==='event_trigger'?'event trigger de plataforma; no RPC ordinario':'RPC ordinario'}.\n- Revocar anon: ${m==='public'?'no en esta candidata; contrato público actual':'sí, incluyendo PUBLIC'}.\n- Limitar a authenticated: ${m==='staff'?'sí para clientes, más service_role; el cuerpo sigue verificando roles':m==='public'?'no; mantener acceso público documentado':'no; excluir también authenticated'}.\n- Exclusivo service_role: ${m==='internal'?'sí para grants externos; propietario mantiene ejecución interna': 'no'}.\n- Rutas directas: ${routes(f).join(', ')||'ninguna en src'}.\n- Llamadores SQL: ${calls(f).join(', ')||'ninguno en funciones seleccionadas; revisar triggers/políticas'}.\n${f.name==='rls_auto_enable'?'- Plataforma: excluida de candidata; Supabase gestiona su event trigger.\n':''}${f.name==='create_order'&&f.identity.split(',').length===6?'- Firma antigua excluida; no se propone concederle permisos.\n':''}\n`;
}
sec+=`## Riesgos específicos y decisiones\n\nconsume_product_inventory y apply_order_discount modifican stock/descuentos con identificadores y actor proporcionados; no tienen guardia de rol. Se proponen como helpers sin acceso anon/authenticated. Las llamadas internas desde RPC SECURITY DEFINER siguen ejecutándose como postgres. release_expired_reservations también modifica pedidos/reservas sin guardia: mismo tratamiento. Ninguna ruta Next.js los llama directamente.\n\ncreate_payment es público y acepta solo un UUID, sin comprobar teléfono/propiedad: conocer el UUID permite reportar un pago por RPC evitando la comprobación de track_order_details en Next.js. Mantener su contrato actual en la candidata NO resuelve esa exposición. Cambiarlo a service_role rompería la ruta actual; requiere un contrato protegido por credencial de seguimiento o servidor privilegiado con validación equivalente, separado y aprobado.\n\ncreate_order de siete parámetros necesita acceso anon para compra pública; sus validaciones de stock/horario/opciones/promoción no sustituyen controles antiautomatización. check_rate_limit público acepta IP/ruta/límites del cliente RPC; no constituye un límite obligatorio del create_order directo. COUNT+INSERT sin serialización y política fail-open de Next.js exigen revisión separada. No afirmar protección completa.\n\ntrack_order mantiene validación número/teléfono y acceso público; 035 no está incluida. APIs actuales de seguimiento/pago dependen de 035 y no funcionan íntegramente solo con esta baseline.\n\nLos triggers no son RPC ordinarios. Revocar su EXECUTE externo no impide el disparo de triggers creados por postgres. Helpers de identidad usados por RLS mantienen EXECUTE para anon/authenticated para no romper evaluación de políticas. Revisar roles negativos, usuario inactivo y bypass directo RPC antes de aprobar.\n\nNo se propone publicar como producción hasta resolver el contrato de create_payment y la protección de RPC públicos. No agregar SERVICE_ROLE_KEY al navegador.\n`;
sec+='\n## Privilegios de tablas y creación de objetos\n\nLa candidata también excluye TRUNCATE, TRIGGER y REFERENCES para anon/authenticated/PUBLIC y revoca CREATE en public. Son propuestas pendientes: TRUNCATE no respeta filtrado RLS y no es necesario para Next.js. service_role conserva sus grants auditados. No se ejecutó ninguno de estos cambios. Los CRUD y las 89 políticas observadas se mantienen para revisión; su combinación permisiva exige pruebas por rol. Los cambios en default privileges se refieren a objetos futuros creados por postgres; otros propietarios necesitarían una revisión específica.\n';
sec='> Auditoría original y propuesta inicial. La decisión técnica vigente, incluyendo create_payment(uuid,text) solo servidor y alta de usuarios inactivos, está en SECURITY_DECISIONS_FINAL.md y RPC_FINAL_MATRIX.md. Los párrafos de riesgos del contrato anterior describen el snapshot, no los permisos de la candidata actualizada.\n\n'+sec;
write('SECURITY_REVIEW.md',sec);
const manifest={snapshot:r.captured_at,counts:{tables:tables.length,functions:functions.length,policies:r.policies.filter(p=>['public','storage'].includes(p.schemaname)).length,constraints:constraints.length},sources:['remote-catalog','remote-extra','migration-analysis'].map(n=>({file:`audit-supabase/${n}.json`,sha256:crypto.createHash('sha256').update(fs.readFileSync(`audit-supabase/${n}.json`)).digest('hex')}))};
write('candidate-manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest.counts));


