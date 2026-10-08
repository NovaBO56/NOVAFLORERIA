import fs from 'node:fs';
const sourceRoot='supabase/baseline-candidate';
const dir=process.argv[2] || sourceRoot;
fs.mkdirSync(dir,{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(`audit-supabase/${n}.json`,'utf8').replace(/^\uFEFF/,''));
const r=read('remote-catalog'),a=read('migration-analysis');
const functions=r.functions.filter(f=>f.schema==='public');
const q=s=>'"'+s.replaceAll('"','""')+'"';
const sig=f=>`${f.schema}.${q(f.name)}(${f.identity?f.identity.split(',').map(x=>x.trim().replace(/^\w+\s+/, '')).join(', '):''})`;
const sql=s=>s.trim().replace(/;$/,'')+';';
const get=n=>functions.find(f=>f.name===n);
let confirm=a.functionComparison.find(f=>f.remote_name==='confirm_payment').expected_statement;
confirm=confirm.replace('  v_payment record;', '  v_payment record;\n  v_order public.orders%rowtype;');
confirm=confirm.replace('select id, order_id, status into v_payment',`-- Orden de bloqueos: pedido antes de pago, igual que create_payment.
  select o.* into v_order from public.orders o
  where o.id = (select p.order_id from public.payments p where p.id = p_payment_id)
  for update;

  select id, order_id, status, amount into v_payment`);
const marker='  -- Bloquea TODAS las reservas';
if(!confirm.includes(marker))throw Error('Fuente confirm_payment cambió');
confirm=confirm.replace(marker,`  if v_order.id is null or v_order.deleted_at is not null
     or v_order.status <> 'pendiente_pago' or v_order.order_type <> 'online' then
    raise exception 'El pedido ya no admite confirmación de pago.';
  end if;
  if v_order.total <= 0 or v_order.total::text = 'NaN' or v_payment.amount is distinct from v_order.total then
    raise exception 'El monto del pago no coincide con el pedido.';
  end if;
  if v_order.reserved_until is not null and v_order.reserved_until <= now() then
    raise exception 'La reserva del pedido venció. No se puede confirmar el pago.';
  end if;

${marker}`);
confirm=confirm.replace('and expires_at < now()', 'and expires_at <= now()');
fs.writeFileSync(`${dir}/CONFIRM_PAYMENT_FINAL.sql`,sql(confirm)+'\n');
const newPay=fs.readFileSync(`${sourceRoot}/CREATE_PAYMENT_FINAL.sql`,'utf8');
const user=`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $new_user$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'empleado', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$new_user$;`;
fs.writeFileSync(`${dir}/HANDLE_NEW_USER_FINAL.sql`,user+'\n');
const A=new Set(['get_business_status','track_order','create_order']);
const B=new Set(['is_active_user','is_admin','is_employee_or_admin']);
const D=new Set(['consume_product_inventory','apply_order_discount','release_expired_reservations','create_payment']);
function category(f){return f.result==='trigger'||f.result==='event_trigger'||D.has(f.name)?'D':A.has(f.name)?'A':B.has(f.name)?'B':f.name==='check_rate_limit'?'A':'C';}
const migration=[`-- CANDIDATA 036, FUERA DE LA CADENA ACTIVA. NO APLICADA.
-- No incluye 035 ni toca schema_migrations. Revisar SECURITY_DECISIONS_FINAL.md.
-- Solo sobre un esquema equivalente al snapshot; no ejecuta baseline ni borra datos.
-- Retirada física de create_order(6) PENDIENTE de aprobación: aquí solo se deshabilita su acceso RPC.
BEGIN;
SET LOCAL search_path = public, extensions, pg_catalog;`,sql(get('release_expired_reservations').definition),sql(confirm),sql(get('create_physical_sale').definition),sql(get('advance_order_status').definition),sql(functions.find(f=>f.name==='create_order'&&f.identity.split(',').length===7).definition),newPay,user];
for(const f of functions){
 if(f.name==='rls_auto_enable')continue; // Supabase administra event trigger, no RPC ordinario.
 if(f.name==='create_payment'&&f.identity.split(',').length===1){
  migration.push(`-- Instalación limpia: firma ausente. Delta histórico: retirada explícita RESTRICT.
-- Sin CASCADE: cualquier dependencia aborta la transacción y debe investigarse.
DO $retire_payment_uuid$
BEGIN
  IF to_regprocedure('public.create_payment(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.create_payment(uuid) FROM PUBLIC, anon, authenticated, service_role';
    EXECUTE 'DROP FUNCTION public.create_payment(uuid) RESTRICT';
  END IF;
END;
$retire_payment_uuid$;`);
  continue;
 }
 const obsolete=f.name==='create_order'&&f.identity.split(',').length===6;
 const revoke=`REVOKE ALL ON FUNCTION ${sig(f)} FROM PUBLIC, anon, authenticated, service_role;`;
 migration.push(obsolete?`DO $obsolete$ BEGIN IF to_regprocedure('public.create_order(text,text,text,jsonb,text,text)') IS NOT NULL THEN EXECUTE '${revoke.replaceAll("'","''")}'; END IF; END; $obsolete$;`:revoke);
 const cat=category(f);
 const roles=obsolete||f.name==='create_payment'?'':cat==='D'?'service_role':cat==='C'?'authenticated, service_role':cat==='B'?'anon, authenticated, service_role':'anon, authenticated, service_role';
 if(roles)migration.push(`GRANT EXECUTE ON FUNCTION ${sig(f)} TO ${roles};`);
}
migration.push(`ALTER FUNCTION public.create_payment(uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.create_payment(uuid,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_payment(uuid,text) TO service_role;
-- create_payment(uuid) ya no existe; solo queda el contrato privado de dos argumentos.
-- No DROP de create_order(6) hasta confirmar consumidores externos y aprobación explícita.
COMMIT;`);
fs.writeFileSync(`${dir}/036_security_rpc_hardening.sql`,migration.join('\n\n')+'\n');
const src=[];function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+f.name;if(f.isDirectory())walk(p);else if(/\.tsx?$/.test(p))src.push([p,fs.readFileSync(p,'utf8')]);}}walk('src');
const matrix=functions.map(f=>{
 const cat=category(f),obsolete=f.name==='create_order'&&f.identity.split(',').length===6;
 const direct=src.filter(([,s])=>new RegExp(`\\.rpc\\(\\s*["']${f.name}["']`).test(s)).map(([p])=>p);
 const role=f.name==='cancel_order'?'auth.uid; empleado/admin para pendiente; solo admin para pagado':/public\.is_admin\s*\(/.test(f.definition)?'is_admin activo':/public\.is_employee_or_admin\s*\(/.test(f.definition)?'empleado/admin activo':B.has(f.name)?'perfil de auth.uid() activo':f.definition.includes('auth.uid()')?'auth.uid() (no siempre autorización)':'sin validación de llamador';
 return {signature:sig(f),category:cat,current:'PUBLIC + anon + authenticated + service_role (efectivo auditado)',internal_check:role,nextjs:obsolete?'ninguna; /api/orders usa 7':f.name==='create_payment'?'ruta payment anterior; código actual usa uuid,text':direct.join(', ')||'sin RPC directo (trigger/política/helper)',recommended:obsolete?'sin EXECUTE externo, retirada física pendiente':f.name==='create_payment'?'uuid: retirada condicional RESTRICT; uuid,text: service_role':f.name==='rls_auto_enable'?'plataforma; no alterar en 036':cat==='D'?'service_role / llamadas internas del propietario':cat==='C'?'authenticated + service_role; comprobar rol dentro':cat==='B'?'anon + authenticated para RLS; sin mutación':'anon + authenticated; conservar contrato público',risk:D.has(f.name)?'ALTO: mutación sin identidad/propiedad suficiente':f.name==='handle_new_user'?'ALTO condicional: autoempleado activo si signup habilitado':obsolete?'ALTO: controles antiguos':f.name==='check_rate_limit'?'MEDIO: límites/IP manipulables y carrera; no barrera RPC obligatoria':cat==='C'?'rol validado, revisar concurrencia/negativos':f.result.endsWith('trigger')?'no es RPC ordinario':'revisar datos públicos y enumeración'};
});
for(const f of r.functions.filter(f=>f.security_definer&&f.schema!=='public'))matrix.push({signature:sig(f),category:'D',current:f.acl,internal_check:'plataforma Vault; cuerpo no capturado, no afirmar validación',nextjs:'ninguna',recommended:'mantener servidor; fuera de 036',risk:'secretos; no conceder a clientes'});
matrix.push({signature:'public.create_payment(uuid,text)',category:'D',current:'no existe en snapshot; solo candidata',internal_check:'teléfono del cliente, pedido online no eliminado pendiente, plazo/reservas, monto e idempotencia bajo bloqueo',nextjs:'src/app/api/orders/[id]/payment/route.ts (cliente administrativo)',recommended:'solo service_role; sin PUBLIC/anon/authenticated',risk:'teléfono no demuestra identidad; probar permisos, API y concurrencia'});
fs.writeFileSync(`${dir}/RPC_FINAL_MATRIX.json`,JSON.stringify(matrix,null,2)+'\n');
const table='| Firma | Categoría | EXECUTE actual | Validación interna | Next.js | Permisos final | Riesgo |\n| --- | --- | --- | --- | --- | --- | --- |\n'+matrix.map(x=>'| '+[x.signature,x.category,x.current,x.internal_check,x.nextjs,x.recommended,x.risk].map(v=>v.replaceAll('|','\\|')).join(' | ')+' |').join('\n');
fs.writeFileSync(`${dir}/RPC_FINAL_MATRIX.md`,'# Matriz completa SECURITY DEFINER\n\nA: acceso anon; B: lectura de identidad para usuarios y RLS (anon conserva ejecución por evaluación de políticas); C: personal autorizado por validación interna; D: servidor/helper interno. Categorías describen la frontera de autorización; A también admite authenticated. Los triggers/event triggers no son RPC ordinarios. Se cubren las 35 public y las dos Vault auditadas.\n\n'+table+'\n');
console.log({matrix:matrix.length,migrationBytes:fs.statSync(`${dir}/036_security_rpc_hardening.sql`).size});
